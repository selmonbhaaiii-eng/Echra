import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { postGBPUpdate, isGoogleMockMode } from "@/lib/google/gmb-api";
import { decrypt } from "@/lib/google/encrypt";
import { refreshAccessToken } from "@/lib/google/oauth";
import { logUsage } from "@/lib/ai/logger";

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data: posts } = await supabase
      .from("posts")
      .select("*, businesses(*)")
      .eq("status", "approved")
      .lte("scheduled_at", new Date().toISOString())
      .limit(50);

    if (!posts || posts.length === 0) {
      return NextResponse.json({ published: 0 });
    }

    let publishedCount = 0;

    for (const post of posts) {
      if (!post.businesses) continue;

      try {
        let validAccessToken = "";

        // If not in mock mode, we need a real access token
        if (!isGoogleMockMode()) {
          const encryptedRefreshToken = post.businesses.google_refresh_token;
          if (!encryptedRefreshToken) {
            throw new Error("Missing Google refresh token");
          }

          const refreshToken = decrypt(encryptedRefreshToken);
          const tokenResponse = await refreshAccessToken(refreshToken);

          if (!tokenResponse.access_token) {
            throw new Error(tokenResponse.error_description || "Failed to refresh token");
          }
          validAccessToken = tokenResponse.access_token;
        }

        const result = await postGBPUpdate({
          accessToken: validAccessToken,
          accountName: post.businesses.gbp_account_name || "",
          locationName: post.businesses.gbp_location_name || "",
          postContent: post.content,
          imageUrl: post.image_url,
        });

        await supabase
          .from("posts")
          .update({
            status: "published",
            published_at: new Date().toISOString(),
            gbp_post_id: result.name,
          })
          .eq("id", post.id);

        // Log successful GBP post publishing!
        await logUsage({
          businessId: post.businesses.id,
          actionType: 'gbp_post_published',
          tokensUsed: 0,
          cost_usd: 0,
          metadata: { post_id: post.id }
        });

        await supabase
          .from("businesses")
          .update({
            posts_this_month: (post.businesses.posts_this_month || 0) + 1,
          })
          .eq("id", post.businesses.id);

        publishedCount++;
      } catch (err: any) {
        await supabase
          .from("posts")
          .update({
            status: "failed",
            failed_reason: err.message || "Publish failed",
            retry_count: (post.retry_count || 0) + 1,
          })
          .eq("id", post.id);

        await supabase.from("error_logs").insert({
          business_id: post.business_id,
          error_type: "PUBLISH_FAILED",
          error_message: err.message || "Publish failed",
          context: { post_id: post.id },
        });
      }
    }

    return NextResponse.json({ published: publishedCount });
  } catch (error) {
    console.error("Publish Posts Cron Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
