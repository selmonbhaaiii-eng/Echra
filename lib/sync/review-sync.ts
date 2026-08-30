import { decrypt } from "@/lib/google/encrypt";
import { fetchReviews, isGoogleMockMode, type GoogleReview } from "@/lib/google/gmb-api";
import { refreshAccessToken } from "@/lib/google/oauth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { logUsage } from "../ai/logger";

type Business = Database["public"]["Tables"]["businesses"]["Row"];

function ratingToNumber(starRating: GoogleReview["starRating"]) {
  const map = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  };

  return starRating ? map[starRating] : 0;
}

function calculateAvgRating(reviews: GoogleReview[]) {
  const ratings = reviews.map((review) => ratingToNumber(review.starRating)).filter(Boolean);

  if (!ratings.length) {
    return 0;
  }

  return Number((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1));
}

async function logSyncError(businessId: string, errorType: string, error: unknown) {
  const supabase = createServiceRoleClient();
  const message = error instanceof Error ? error.message : String(error);

  await supabase.from("error_logs").insert({
    business_id: businessId,
    error_type: errorType,
    error_message: message,
    context: { source: "review-sync" },
  });
}

export async function getValidAccessToken(business: Business) {
  const supabase = createServiceRoleClient();
  const expiresAt = business.google_token_expiry
    ? new Date(business.google_token_expiry).getTime()
    : 0;

  if (business.google_access_token && expiresAt > Date.now() + 60_000) {
    return business.google_access_token;
  }

  if (!business.google_refresh_token) {
    throw new Error("TOKEN_EXPIRED: Missing Google refresh token.");
  }

  const refreshToken = decrypt(business.google_refresh_token);
  const tokens = await refreshAccessToken(refreshToken);

  if (!tokens.access_token || tokens.error) {
    await supabase
      .from("businesses")
      .update({ gbp_connected: false, google_access_token: null, google_token_expiry: null })
      .eq("id", business.id);

    throw new Error(tokens.error_description ?? tokens.error ?? "TOKEN_EXPIRED");
  }

  const expiry = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();

  await supabase
    .from("businesses")
    .update({
      google_access_token: tokens.access_token,
      google_token_expiry: expiry,
    })
    .eq("id", business.id);

  return tokens.access_token;
}

function errorTypeFromMessage(message: string) {
  if (message.includes("RESOURCE_EXHAUSTED") || message.includes("quota")) {
    return "GOOGLE_API_QUOTA_EXCEEDED";
  }

  if (message.includes("TOKEN_EXPIRED") || message.includes("invalid_grant")) {
    return "TOKEN_EXPIRED";
  }

  if (message.includes("NO_LOCATIONS_FOUND")) {
    return "NO_LOCATIONS_FOUND";
  }

  if (message.includes("PERMISSION_DENIED")) {
    return "BUSINESS_NOT_VERIFIED";
  }

  return "GOOGLE_REVIEW_SYNC_FAILED";
}

export async function syncReviewsForBusiness(businessId: string) {
  const supabase = createServiceRoleClient();
  const { data: business, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();

  if (error || !business) {
    return { synced: 0, total: 0, error: error?.message ?? "Business not found" };
  }

  if (!business.gbp_connected) {
    return { synced: 0, total: 0, error: "Not connected" };
  }

  if (!business.gbp_account_name || !business.gbp_location_name) {
    return { synced: 0, total: 0, error: "Missing GBP account or location." };
  }

  try {
    const accessToken = await getValidAccessToken(business);
    const allReviews: GoogleReview[] = [];
    let pageToken: string | undefined;

    do {
      const page = await fetchReviews({
        accessToken,
        accountName: business.gbp_account_name,
        locationName: business.gbp_location_name,
        pageToken,
      });

      allReviews.push(...(page.reviews ?? []));
      pageToken = page.nextPageToken;
    } while (pageToken);

    let synced = 0;

    for (const review of allReviews) {
      const googleReviewId = isGoogleMockMode() ? `${businessId}_${review.reviewId}` : review.reviewId;
      
      // Check if review already exists to determine if it is new
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("google_review_id", googleReviewId)
        .maybeSingle();

      const isNew = !existingReview;

      const { error: upsertError } = await supabase.from("reviews").upsert(
        {
          business_id: businessId,
          google_review_id: googleReviewId,
          reviewer_name: review.reviewer?.displayName ?? "Anonymous",
          reviewer_avatar: review.reviewer?.profilePhotoUrl ?? null,
          rating: ratingToNumber(review.starRating),
          review_text: review.comment ?? "",
          reply_text: review.reviewReply?.comment ?? null,
          review_date: review.createTime ?? review.updateTime ?? new Date().toISOString(),
          synced_at: new Date().toISOString(),
          phrases_extracted: false,
          post_created: false,
        },
        { onConflict: "google_review_id" },
      );

      if (!upsertError) {
        synced += 1;
        if (isNew) {
          await logUsage({
            businessId,
            actionType: 'review_synced',
            tokensUsed: 0,
            cost_usd: 0,
            metadata: { rating: ratingToNumber(review.starRating) }
          });
        }
      }
    }

    await supabase
      .from("businesses")
      .update({
        last_review_sync: new Date().toISOString(),
        total_reviews: allReviews.length,
        avg_rating: calculateAvgRating(allReviews),
        ...(synced > 0 ? {
          review_intelligence_updated_at: null,
          dashboard_actions_updated_at: null,
        } : {})
      })
      .eq("id", businessId);

    return { synced, total: allReviews.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const errorType = errorTypeFromMessage(message);
    await logSyncError(businessId, errorType, err);

    if (errorType === "TOKEN_EXPIRED") {
      await supabase
        .from("businesses")
        .update({ gbp_connected: false, google_access_token: null, google_token_expiry: null })
        .eq("id", businessId);
    }

    return { synced: 0, total: 0, error: message, errorType };
  }
}
