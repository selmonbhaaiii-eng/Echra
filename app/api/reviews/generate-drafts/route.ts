import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractPhrasesFromReview } from "@/lib/ai/extract-phrases";
import { generatePostFromReview } from "@/lib/ai/generate-post";
import { GoogleGenAI } from "@google/genai";
import { logUsage } from "@/lib/ai/logger";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const REPLY_PROMPT = `
You are the owner of {businessName}, a {category} in {location}.
A customer named {reviewerName} left a {rating}-star review:
"{reviewText}"

Write a direct, professional, and empathetic reply to this customer.
If it's a positive review, be grateful and welcoming.
If it's a negative review, be constructive, apologize for the specific issue, and offer to make it right.
Keep it under 100 words. Do not use hashtags.
Return ONLY the reply text.
`;

async function generateReviewReply(params: {
  businessName: string;
  location: string;
  category: string;
  reviewerName: string;
  rating: number;
  reviewText: string;
}): Promise<{ text: string; usageMetadata?: any }> {
  const prompt = REPLY_PROMPT
    .replace("{businessName}", params.businessName)
    .replace("{location}", params.location)
    .replace("{category}", params.category)
    .replace("{reviewerName}", params.reviewerName)
    .replace("{rating}", params.rating.toString())
    .replace("{reviewText}", params.reviewText);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    return {
      text: response.text?.trim() ?? "",
      usageMetadata: response.usageMetadata,
    };
  } catch (error) {
    console.error("Gemini Reply Generation Error:", error);
    return { text: "" };
  }
}

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
      .select("id, name, location, category")
      .eq("id", business_id)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Fetch up to 5 reviews that need processing (either missing reply or missing post)
    const { data: reviewsToProcess } = await supabase
      .from("reviews")
      .select("*")
      .eq("business_id", business.id)
      .or("draft_reply_text.is.null,phrases_extracted.is.false")
      .limit(1); // Process one by one to avoid 429 errors from Gemini

    if (!reviewsToProcess || reviewsToProcess.length === 0) {
      return NextResponse.json({ processed: 0, message: "No drafts needed" });
    }

    let processedCount = 0;

    for (const review of reviewsToProcess) {
      const reviewerName = review.reviewer_name || "A customer";
      const rating = review.rating || 5;
      const reviewText = review.review_text || "";

      // 1. Phrase Extraction (if missing)
      let phrases = (review.extracted_phrases as any)?.phrases || [];
      let extractResult = review.extracted_phrases || {};
      if (!review.phrases_extracted || phrases.length === 0) {
        const { result: extracted, usageMetadata: extractUsage } = await extractPhrasesFromReview(reviewText, reviewerName, rating);
        extractResult = extracted;
        phrases = extractResult.phrases || [];

        if (extractUsage) {
          await logUsage({
            businessId: business.id,
            actionType: 'ai_phrases_extracted',
            promptTokens: extractUsage.promptTokenCount,
            candidatesTokens: extractUsage.candidatesTokenCount,
            metadata: { review_id: review.id }
          });
        }
      }

      const updates: any = {
        extracted_phrases: extractResult,
        phrases_extracted: true,
      };

      // 2. Generate Reply (if missing)
      if (!review.draft_reply_text && !review.reply_text) {
        const { text: replyText, usageMetadata: replyUsage } = await generateReviewReply({
          businessName: business.name,
          location: business.location || "",
          category: business.category || "business",
          reviewerName,
          rating,
          reviewText,
        });

        if (replyText) {
          updates.draft_reply_text = replyText;
          updates.draft_reply_status = "pending";

          if (replyUsage) {
            await logUsage({
              businessId: business.id,
              actionType: 'ai_reply_generated',
              promptTokens: replyUsage.promptTokenCount,
              candidatesTokens: replyUsage.candidatesTokenCount,
              metadata: { tone: 'default', rating }
            });
          }
        }
      }

      // Post generation removed per user request (manual flow only)

      // Save all updates to the review
      await supabase
        .from("reviews")
        .update(updates)
        .eq("id", review.id);

      processedCount++;
    }

    return NextResponse.json({ processed: processedCount });
  } catch (error) {
    console.error("Generate Drafts API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
