import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUpcomingOccasions } from "@/lib/automation/seasonal-calendar";
import { generateSeasonalPost } from "@/lib/ai/generate-post";
import { logUsage } from "@/lib/ai/logger";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { business_id } = await request.json();

    if (!business_id) {
      return NextResponse.json({ error: "Business ID required" }, { status: 400 });
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, location, category, business_context")
      .eq("id", business_id)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Get occasions for the next 30 days
    const upcoming = getUpcomingOccasions(30);
    if (upcoming.length === 0) {
      return NextResponse.json({ processed: 0, message: "No upcoming occasions" });
    }

    // Fetch existing seasonal posts to avoid duplicates
    const { data: existingPosts } = await supabase
      .from("posts")
      .select("scheduled_at")
      .eq("business_id", business.id)
      .eq("source_type", "seasonal");

    const existingDates = new Set(
      (existingPosts || []).map(p => {
        if (!p.scheduled_at) return "";
        const d = new Date(p.scheduled_at);
        return `${d.getMonth() + 1}-${d.getDate()}`;
      })
    );

    let processedCount = 0;

    for (const occasion of upcoming) {
      const [month, day] = occasion.date.split("-").map(Number);
      const shortDate = `${month}-${day}`;
      
      if (existingDates.has(shortDate)) {
        continue;
      }

      // Generate post
      const { text: postText, usageMetadata: seasonalUsage } = await generateSeasonalPost({
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

      if (postText) {
        // Compute scheduled_at
        const now = new Date();
        let d = new Date(now.getFullYear(), month - 1, day, 9, 0, 0, 0);
        if (d.getTime() < now.getTime()) {
          d = new Date(now.getFullYear() + 1, month - 1, day, 9, 0, 0, 0);
        }

        await supabase
          .from("posts")
          .insert({
            business_id: business.id,
            content: postText,
            source_type: "seasonal",
            status: "pending_approval",
            scheduled_at: d.toISOString(),
          });
        
        processedCount++;
      }
    }

    return NextResponse.json({ processed: processedCount });
  } catch (error) {
    console.error("Generate Calendar Drafts API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
