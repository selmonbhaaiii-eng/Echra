import { NextResponse } from "next/server";
import { getUpcomingLocalEvents } from "@/lib/automation/local-events";
import { generateEventPost } from "@/lib/ai/generate-post";
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

  const upcoming = getUpcomingLocalEvents(business.location, 14);
  const created = [];

  for (const event of upcoming) {
    // Check if we already generated a post for this specific event
    const { data: existing } = await service
      .from("posts")
      .select("id")
      .eq("business_id", business.id)
      .eq("source_type", "event")
      .ilike("content", `%${event.name}%`)
      .maybeSingle();

    if (existing) continue;

    const { text: content, usageMetadata: eventUsage } = await generateEventPost({
      business: business as any,
      eventName: event.name,
      eventDate: event.date,
    });

    if (eventUsage) {
      await logUsage({
        businessId: business.id,
        actionType: 'ai_post_generated',
        promptTokens: eventUsage.promptTokenCount,
        candidatesTokens: eventUsage.candidatesTokenCount,
        metadata: { source_type: 'event', event_name: event.name }
      });
    }

    const { data: post } = await service
      .from("posts")
      .insert({
        business_id: business.id,
        content,
        source_type: "event",
        status: "pending_approval",
      })
      .select("*")
      .single();

    if (post) created.push(post);
  }

  return NextResponse.json({ success: true, events: upcoming, posts: created });
}
