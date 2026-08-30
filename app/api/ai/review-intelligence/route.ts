import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

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
      .select("review_intelligence, review_intelligence_updated_at")
      .eq("id", businessId)
      .eq("owner_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const lastUpdated = business.review_intelligence_updated_at;
    const cacheAge = lastUpdated ? Date.now() - new Date(lastUpdated).getTime() : Infinity;
    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

    // 2. If fresh, return cache
    if (!forceRefresh && business.review_intelligence && Object.keys(business.review_intelligence).length > 0 && cacheAge < CACHE_DURATION) {
      return NextResponse.json(business.review_intelligence);
    }

    // 3. Otherwise, fetch recent extracted phrases
    const { data: reviews } = await supabase
      .from("reviews")
      .select("extracted_phrases")
      .eq("business_id", businessId)
      .eq("phrases_extracted", true)
      .not("extracted_phrases", "is", null)
      .order("review_date", { ascending: false })
      .limit(20);

    const allPhrases: string[] = [];
    if (reviews) {
      for (const r of reviews) {
        const obj = r.extracted_phrases as any;
        if (obj && Array.isArray(obj.phrases)) {
          allPhrases.push(...obj.phrases);
        }
      }
    }

    if (allPhrases.length === 0) {
      return NextResponse.json({
        customers_love: "Not enough data yet.",
        customers_dislike: "Not enough data yet.",
        insight: "We need a few more reviews to generate actionable insights."
      });
    }

    // 4. Generate with Gemini
    const prompt = `You are a review intelligence AI. I will give you a list of extracted phrases from recent Google reviews for a business.
Analyze them and provide a JSON summary of what customers love, what they dislike, and one single actionable insight.

Rules:
- \`customers_love\`: A single short string summarizing top positives (e.g. "Friendly staff (4) · Cold brew (3) · Fast service (2)")
- \`customers_dislike\`: A single short string summarizing top negatives (e.g. "Waiting time (2) · Parking (1)") or "Nothing specific" if none.
- \`insight\`: A 1-sentence actionable insight based on the data.
- Return ONLY a valid JSON object matching the exact keys above. No markdown.

Phrases:
${JSON.stringify(allPhrases)}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text?.trim() || "{}";
    const summary = JSON.parse(text);

    // 5. Save to cache
    await supabase.from("businesses").update({
      review_intelligence: summary,
      review_intelligence_updated_at: new Date().toISOString()
    }).eq("id", businessId);

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Review Intelligence API Error:", error);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
