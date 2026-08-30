import { NextResponse } from "next/server";
import { getUpcomingOccasions } from "@/lib/automation/seasonal-calendar";
import { generateSeasonalPost } from "@/lib/ai/generate-post";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { logUsage } from "@/lib/ai/logger";

export async function POST() {
  const supabase = createClient();
  const service = createServiceRoleClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id,name,category,location,business_context")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!business) {
    return NextResponse.json({ success: false, error: "No business found" }, { status: 404 });
  }

  const upcoming = getUpcomingOccasions(7);
  const created = [];

  for (const occasion of upcoming) {
    const { data: existing } = await service
      .from("posts")
      .select("id")
      .eq("business_id", business.id)
      .eq("source_type", "seasonal")
      .ilike("content", `%${occasion.name}%`)
      .maybeSingle();

    if (existing) continue;

    const { text: content, usageMetadata: seasonalUsage } = await generateSeasonalPost({
      business: business as any,
      occasionName: occasion.name,
      occasionDate: occasion.date,
    });

    if (seasonalUsage) {
      await logUsage({
        businessId: business.id,
        actionType: 'ai_post_generated',
        promptTokens: seasonalUsage.promptTokenCount,
        candidatesTokens: seasonalUsage.candidatesTokenCount,
        metadata: { source_type: 'seasonal', occasion_name: occasion.name }
      });
    }

    const { data: post } = await service
      .from("posts")
      .insert({
        business_id: business.id,
        content,
        source_type: "seasonal",
        status: "pending_approval",
      })
      .select("*")
      .single();

    if (post) created.push(post);
  }

  return NextResponse.json({ success: true, occasions: upcoming, posts: created });
}
