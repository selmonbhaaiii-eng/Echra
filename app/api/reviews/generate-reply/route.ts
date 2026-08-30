import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { GoogleGenAI } from "@google/genai";
import { replyToReview } from "@/lib/google/gmb-api";
import { getValidAccessToken } from "@/lib/sync/review-sync";
import { logUsage } from "@/lib/ai/logger";

import { Database } from "@/types/database";
import { buildBusinessContext } from "@/lib/ai/context-builder";

type Business = Database["public"]["Tables"]["businesses"]["Row"];

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function generateReviewReply(params: {
  business: Business;
  reviewerName: string;
  rating: number;
  reviewText: string;
  tone: string;
}): Promise<{ text: string; usageMetadata?: any }> {
  const contextBlock = buildBusinessContext(params.business);

  const toneInstructions: Record<string, string> = {
    professional:
      'Professional, courteous, and confident tone.',
    warm_friendly:
      'Warm, personal, neighbourhood-friendly tone. ' +
      'Like a friend responding.',
    apologetic:
      'Empathetic, apologetic, solution-focused. ' +
      'Acknowledge the issue, offer to make it right.',
    funny:
      'Light-hearted and witty. Funny but respectful. ' +
      'Use wordplay if natural.',
    hinglish:
      'Natural Hinglish — mix Hindi and English ' +
      'words naturally. E.g. shukriya, bahut accha, ' +
      'zaroor aana, aapka swagat hai.'
  };

  const isNegative = params.rating <= 3;

  const prompt = `
${contextBlock}

TASK: Write a ${isNegative ? 'thoughtful response to a negative' : 'reply to a positive'} Google review.

Reviewer: ${params.reviewerName}
Rating: ${params.rating} stars
Review: "${params.reviewText}"

Tone required: ${toneInstructions[params.tone] || toneInstructions.professional}

RULES:
- Address reviewer by their first name
- Reference something specific from their review
- ${isNegative
    ? 'Acknowledge the issue sincerely. Offer to resolve it. Provide contact info or invite them back.'
    : 'Express genuine gratitude. Mention the specific thing they praised.'}
- Match tone exactly as specified above
- Keep under 100 words
- 0-1 emojis maximum
- No hashtags
- Sound human and real
- NEVER mention anything in the never_mention list

Return only the reply text. No explanation.
  `.trim();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    return {
      text: response.text?.trim() ?? "",
      usageMetadata: response.usageMetadata,
    };
  } catch (error: any) {
    console.error("Gemini Reply Generation Error:", error);
    
    // Fallback if the user's Gemini Free Tier Quota is exhausted (429)
    if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("Quota")) {
      return {
        text: `[Mock AI Reply - API Quota Reached]\nThank you so much for the ${params.rating}-star review, ${params.reviewerName}! We really appreciate your feedback and hope to see you again soon. (Generated in ${params.tone || 'professional'} tone)`,
        usageMetadata: { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 },
      };
    }
    
    return { text: "" };
  }
}

export async function POST(request: Request) {
  try {
    const { review_id, tone, business_id } = await request.json();

    if (!review_id || !business_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createClient();

    // Verify auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify business ownership
    const { data: business } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", business_id)
      .eq("owner_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Unauthorized access to business" }, { status: 403 });
    }

    // Get the review
    const { data: review } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", review_id)
      .eq("business_id", business_id)
      .single();

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Generate reply using AI
    const { text: replyText, usageMetadata } = await generateReviewReply({
      business,
      reviewerName: review.reviewer_name || "A customer",
      rating: review.rating || 5,
      reviewText: review.review_text || "",
      tone: tone || "professional",
    }); 

    if (!replyText) {
      throw new Error("AI failed to generate a reply");
    }

    if (usageMetadata) {
      await logUsage({
        businessId: business.id,
        actionType: 'ai_reply_generated',
        promptTokens: usageMetadata.promptTokenCount,
        candidatesTokens: usageMetadata.candidatesTokenCount,
        metadata: { tone: tone || "professional", rating: review.rating }
      });
    }

    // Save the draft to the database
    await supabase
      .from("reviews")
      .update({
        draft_reply_text: replyText,
        draft_reply_status: "pending",
      })
      .eq("id", review.id);

    return NextResponse.json({ reply: replyText });
  } catch (error) {
    console.error("Generate Reply Error:", error);
    return NextResponse.json({ error: "Failed to generate reply" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { review_id, action, content } = await request.json();

    if (!review_id || !["approve", "publish", "save_draft"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership of the review before using service client
    const { data: reviewCheck } = await supabase
      .from("reviews")
      .select("business_id, google_review_id, businesses(id, gbp_connected, gbp_account_name, gbp_location_name, google_access_token, google_refresh_token, google_token_expiry)")
      .eq("id", review_id)
      .single();

    if (!reviewCheck) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Since RLS is active, supabase client can only read the review if the user is the owner of the business.
    // So if reviewCheck exists, the user is authorized. We can now use service role to update.
    const adminClient = createServiceRoleClient();

    let updateData: any = {};
    if (action === "approve") {
      updateData = {
        draft_reply_text: content,
        draft_reply_status: "approved",
      };
    } else if (action === "save_draft") {
      updateData = {
        draft_reply_text: content,
        draft_reply_status: "pending",
      };
    } else if (action === "publish") {
      const business = Array.isArray(reviewCheck.businesses) ? reviewCheck.businesses[0] : reviewCheck.businesses;
      
      if (!business?.gbp_connected || !business?.gbp_account_name || !business?.gbp_location_name) {
        return NextResponse.json({ error: "Google Business Profile not properly connected" }, { status: 400 });
      }

      try {
        const accessToken = await getValidAccessToken(business as any);
        await replyToReview({
          accessToken,
          accountName: business.gbp_account_name,
          locationName: business.gbp_location_name,
          reviewId: reviewCheck.google_review_id || "",
          replyText: content,
        });

        // Log successful GBP reply publishing!
        await logUsage({
          businessId: business.id,
          actionType: 'gbp_reply_published',
          tokensUsed: 0,
          cost_usd: 0,
          metadata: { review_id: review_id }
        });
      } catch (gAPIError) {
        console.error("Google API Publish Error:", gAPIError);
        return NextResponse.json({ error: "Failed to publish to Google" }, { status: 502 });
      }

      updateData = {
        draft_reply_text: content,
        draft_reply_status: "published",
        reply_text: content,
        replied_at: new Date().toISOString(),
      };
    }

    const { error } = await adminClient
      .from("reviews")
      .update(updateData)
      .eq("id", review_id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Approve Reply Error:", error);
    return NextResponse.json({ error: "Failed to approve reply" }, { status: 500 });
  }
}
