import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("business_id");
    const forceRefresh = searchParams.get("force") === "true";

    if (!businessId) {
      return NextResponse.json({ error: "Missing business_id" }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Check cache
    const { data: business } = await supabase
      .from("businesses")
      .select("dashboard_actions, dashboard_actions_updated_at")
      .eq("id", businessId)
      .eq("owner_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const lastUpdated = business.dashboard_actions_updated_at;
    const cacheAge = lastUpdated ? Date.now() - new Date(lastUpdated).getTime() : Infinity;
    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

    // 2. If fresh, return cache
    if (!forceRefresh && business.dashboard_actions && Array.isArray(business.dashboard_actions) && business.dashboard_actions.length > 0 && cacheAge < CACHE_DURATION) {
      return NextResponse.json(business.dashboard_actions);
    }

    // 3. Gather Context
    // Get recent reviews
    const { data: recentReviews } = await supabase
      .from("reviews")
      .select("rating, review_text, reply_text, extracted_phrases")
      .eq("business_id", businessId)
      .order("review_date", { ascending: false })
      .limit(10);

    // Get last post
    const { data: lastPost } = await supabase
      .from("posts")
      .select("created_at")
      .eq("business_id", businessId)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get pending posts
    const { count: pendingPostsCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "pending_approval");

    const unrepliedNegative = recentReviews?.filter(r => (r.rating || 0) <= 3 && !r.reply_text).length || 0;
    const unrepliedTotal = recentReviews?.filter(r => !r.reply_text).length || 0;
    
    // Get popular phrases
    const phrasesCount: Record<string, number> = {};
    recentReviews?.forEach(r => {
      const obj = r.extracted_phrases as any;
      if (obj && Array.isArray(obj.phrases)) {
        obj.phrases.forEach((p: string) => {
          phrasesCount[p] = (phrasesCount[p] || 0) + 1;
        });
      }
    });
    const popularPhrases = Object.entries(phrasesCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => `${x[0]} (${x[1]} times)`);

    const daysSinceLastPost = lastPost?.created_at 
      ? Math.floor((Date.now() - new Date(lastPost.created_at).getTime()) / (1000 * 60 * 60 * 24)) 
      : 30; // assume 30 if no post

    // 4. Generate with Gemini
    const prompt = `You are an AI assistant for a local business owner. Based on their current data, recommend exactly 4 high-priority actions for them to take today.

Current Data:
- Unreplied Negative Reviews: ${unrepliedNegative}
- Total Unreplied Reviews: ${unrepliedTotal}
- Days since last published post: ${daysSinceLastPost}
- Posts waiting for approval: ${pendingPostsCount}
- Popular customer phrases lately: ${popularPhrases.join(", ")}

Return ONLY a valid JSON array of exactly 4 objects. Each object must have these exact keys:
{
  "icon_color": "red" | "yellow" | "green" | "blue",
  "text": "A short, actionable description (e.g. '2 reviews need attention')",
  "button_text": "Short label for the button (e.g. 'Review Now')",
  "action_type": "review" | "post" | "queue"
}

Guidelines for color:
- red = urgent (e.g., negative reviews need reply, pending posts piling up)
- yellow = warning (e.g., haven't posted in > 7 days)
- green = positive opportunity (e.g., popular phrase mentioned, create promo post)
- blue = upcoming or general (e.g., seasonal post, general maintenance)

Make the text sound human and direct. NO markdown around the JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text?.trim() || "[]";
    const actions = JSON.parse(text);

    // 5. Save to cache
    await supabase.from("businesses").update({
      dashboard_actions: actions,
      dashboard_actions_updated_at: new Date().toISOString()
    }).eq("id", businessId);

    return NextResponse.json(actions);
  } catch (error) {
    console.error("Dashboard Actions API Error:", error);
    return NextResponse.json({ error: "Failed to generate actions" }, { status: 500 });
  }
}
