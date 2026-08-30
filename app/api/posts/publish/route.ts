import { NextResponse } from "next/server";
import { isGoogleMockMode, postGBPUpdate } from "@/lib/google/gmb-api";
import { getValidAccessToken } from "@/lib/sync/review-sync";
import { calculateHealthScore } from "@/lib/health/calculate-score";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { logUsage } from "@/lib/ai/logger";
import type { Database } from "@/types/database";

type Business = Database["public"]["Tables"]["businesses"]["Row"];
type PostWithBusiness = Database["public"]["Tables"]["posts"]["Row"] & {
  businesses: Business | null;
};

function isCronAuthorized(request: Request) {
  const expected = process.env.CRON_SECRET;
  const header = request.headers.get("Authorization");
  return Boolean(expected && header === `Bearer ${expected}`);
}

export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*, businesses(*)")
    .eq("status", "approved")
    .lte("scheduled_at", new Date().toISOString())
    .limit(50);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  let published = 0;
  const failures = [];

  for (const post of (posts ?? []) as PostWithBusiness[]) {
    const business = post.businesses;
    if (!business) continue;

    try {
      const accessToken = isGoogleMockMode() ? (business.google_access_token ?? "mock-token") : await getValidAccessToken(business);
      const result = await postGBPUpdate({
        accessToken,
        accountName: business.gbp_account_name ?? "accounts/mock_account_123",
        locationName: business.gbp_location_name ?? "locations/mock_location_456",
        postContent: post.content,
        imageUrl: post.image_url,
      });

      await supabase
        .from("posts")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          gbp_post_id: result.name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", post.id);

      // Log successful GBP post publishing!
      await logUsage({
        businessId: business.id,
        actionType: 'gbp_post_published',
        tokensUsed: 0,
        cost_usd: 0,
        metadata: { post_id: post.id }
      });

      await supabase
        .from("businesses")
        .update({ 
          posts_this_month: (business.posts_this_month ?? 0) + 1,
          dashboard_actions_updated_at: null
        })
        .eq("id", business.id);

      await calculateHealthScore(business.id);
      published += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failures.push({ postId: post.id, error: message });

      await supabase
        .from("posts")
        .update({
          status: "failed",
          failed_reason: message,
          retry_count: (post.retry_count ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", post.id);

      await supabase.from("error_logs").insert({
        business_id: post.business_id,
        error_type: "PUBLISH_FAILED",
        error_message: message,
        context: { post_id: post.id },
      });
    }
  }

  return NextResponse.json({ success: true, published, failures });
}
