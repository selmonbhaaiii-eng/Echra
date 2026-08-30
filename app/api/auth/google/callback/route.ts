import { NextResponse } from "next/server";
import { encrypt } from "@/lib/google/encrypt";
import { fetchGBPAccountInfo } from "@/lib/google/gmb-api";
import { exchangeCodeForTokens } from "@/lib/google/oauth";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { syncReviewsForBusiness } from "@/lib/sync/review-sync";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const businessId = url.searchParams.get("state");
  const googleError = url.searchParams.get("error");

  if (googleError) {
    return NextResponse.redirect(
      new URL(`/dashboard/connect?error=${encodeURIComponent(googleError)}`, url.origin),
    );
  }

  if (!code || !businessId) {
    return NextResponse.redirect(new URL("/dashboard/connect?error=missing_google_code", url.origin));
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id,owner_id")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) {
    return NextResponse.redirect(new URL("/dashboard/connect?error=business_not_found", url.origin));
  }

  const service = createServiceRoleClient();

  try {
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error(tokens.error_description ?? tokens.error ?? "Google did not return tokens.");
    }

    const accountInfo = await fetchGBPAccountInfo(tokens.access_token);
    const tokenExpiry = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();

    await service
      .from("businesses")
      .update({
        name: accountInfo.locationLabel,
        gbp_connected: true,
        gbp_account_name: accountInfo.accountName,
        gbp_location_name: accountInfo.locationName,
        gbp_location_id: accountInfo.locationId,
        google_access_token: tokens.access_token,
        google_refresh_token: encrypt(tokens.refresh_token),
        google_token_expiry: tokenExpiry,
        last_review_sync: null,
      })
      .eq("id", businessId);

    const syncResult = await syncReviewsForBusiness(businessId);
    const redirect = new URL("/dashboard/connect", url.origin);
    redirect.searchParams.set("connected", "true");
    redirect.searchParams.set("synced", String(syncResult.synced ?? 0));
    return NextResponse.redirect(redirect);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to connect Google.";

    await service.from("error_logs").insert({
      business_id: businessId,
      error_type: message.includes("NO_LOCATIONS_FOUND")
        ? "NO_LOCATIONS_FOUND"
        : "GOOGLE_OAUTH_CALLBACK_FAILED",
      error_message: message,
      context: { source: "google-callback" },
    });

    const redirect = new URL("/dashboard/connect", url.origin);
    redirect.searchParams.set("error", message);
    return NextResponse.redirect(redirect);
  }
}
