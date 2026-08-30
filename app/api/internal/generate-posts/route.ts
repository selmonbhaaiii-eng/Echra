import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUpcomingOccasions } from "@/lib/automation/seasonal-calendar";
import { extractPhrasesFromReview } from "@/lib/ai/extract-phrases";
import { generatePostFromReview, generateSeasonalPost, suggestImageForPost } from "@/lib/ai/generate-post";
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
Tone requested: {tone}

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
  tone: string;
}): Promise<{ text: string; usageMetadata?: any }> {
  const prompt = REPLY_PROMPT
    .replace("{businessName}", params.businessName)
    .replace("{location}", params.location)
    .replace("{category}", params.category)
    .replace("{reviewerName}", params.reviewerName)
    .replace("{rating}", params.rating.toString())
    .replace("{reviewText}", params.reviewText)
    .replace("{tone}", params.tone);

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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let processedReviews = 0;
  let generatedSeasonal = 0;
  let generatedReplies = 0;

  try {
    const { data: businesses } = await supabase
      .from('businesses')
      .select('*')
      .eq('gbp_connected', true);

    if (!businesses) {
      return NextResponse.json({ success: true, message: "No businesses found" });
    }

    for (const business of businesses) {
      // --- PART 1: Review to Post ---
      const { data: postRule } = await supabase
        .from('automation_rules')
        .select('is_active, config')
        .eq('business_id', business.id)
        .eq('rule_type', 'review_to_post')
        .single();

      if (postRule && postRule.is_active) {
        const minRating = postRule.config?.min_rating ?? 4;
        
        const { data: reviews } = await supabase
          .from('reviews')
          .select('*')
          .eq('business_id', business.id)
          .eq('phrases_extracted', false)
          .eq('post_created', false)
          .gte('rating', minRating)
          .limit(2); // max 2 per cron run per business

        if (reviews && reviews.length > 0) {
          for (const review of reviews) {
            try {
              const { result: extractResult, usageMetadata: extractUsage } = await extractPhrasesFromReview(
                review.review_text || "",
                review.reviewer_name || "A customer",
                review.rating || 5
              );
              const phrases = extractResult.phrases || [];

              if (extractUsage) {
                await logUsage({
                  businessId: business.id,
                  actionType: 'ai_phrases_extracted',
                  promptTokens: extractUsage.promptTokenCount,
                  candidatesTokens: extractUsage.candidatesTokenCount,
                  metadata: { review_id: review.id }
                });
              }

              await supabase.from('reviews').update({
                extracted_phrases: extractResult,
                phrases_extracted: true
              }).eq('id', review.id);

              if (phrases.length > 0) {
                const { text: content, usageMetadata: postUsage } = await generatePostFromReview({
                  business: business,
                  reviewerName: review.reviewer_name || "A customer",
                  phrases,
                  rating: review.rating || 5,
                  tone: "warm_friendly" // default tone for post
                });

                if (postUsage) {
                  await logUsage({
                    businessId: business.id,
                    actionType: 'ai_post_generated',
                    promptTokens: postUsage.promptTokenCount,
                    candidatesTokens: postUsage.candidatesTokenCount,
                    metadata: { source_type: 'review', review_id: review.id }
                  });
                }

                if (content) {
                  const { url: suggestedImageUrl, usageMetadata: imageUsage } = await suggestImageForPost(content, business.id, supabase);

                  if (imageUsage) {
                    await logUsage({
                      businessId: business.id,
                      actionType: 'ai_image_suggested',
                      promptTokens: imageUsage.promptTokenCount,
                      candidatesTokens: imageUsage.candidatesTokenCount,
                      metadata: { post_content_length: content.length }
                    });
                  }

                  const { data: post } = await supabase.from('posts').insert({
                    business_id: business.id,
                    content,
                    source_type: 'review',
                    source_review_id: review.id,
                    status: 'pending_approval',
                    image_url: suggestedImageUrl
                  }).select().single();

                  if (post) {
                    await supabase.from('reviews').update({
                      post_created: true,
                      post_id: post.id
                    }).eq('id', review.id);
                    processedReviews++;
                  }
                }
              }
              await delay(3000); // 3 second delay to avoid rate limit
            } catch (err: any) {
              console.error(`Error processing review post ${review.id}:`, err.message);
              continue;
            }
          }
        }
      }

      // --- PART 2: Auto Reply ---
      const { data: replyRule } = await supabase
        .from('automation_rules')
        .select('is_active, config')
        .eq('business_id', business.id)
        .eq('rule_type', 'auto_reply')
        .single();

      if (replyRule && replyRule.is_active) {
        const tone = replyRule.config?.default_tone ?? 'warm_friendly';
        
        const { data: reviewsToReply } = await supabase
          .from('reviews')
          .select('*')
          .eq('business_id', business.id)
          .is('draft_reply_text', null)
          .is('reply_text', null)
          .limit(2); // max 2 per cron run per business

        if (reviewsToReply && reviewsToReply.length > 0) {
          for (const review of reviewsToReply) {
            try {
              const { text: replyText, usageMetadata: replyUsage } = await generateReviewReply({
                businessName: business.name,
                location: business.location || "",
                category: business.category || "business",
                reviewerName: review.reviewer_name || "A customer",
                rating: review.rating || 5,
                reviewText: review.review_text || "",
                tone
              });

              if (replyText) {
                if (replyUsage) {
                  await logUsage({
                    businessId: business.id,
                    actionType: 'ai_reply_generated',
                    promptTokens: replyUsage.promptTokenCount,
                    candidatesTokens: replyUsage.candidatesTokenCount,
                    metadata: { tone, rating: review.rating }
                  });
                }

                await supabase
                  .from('reviews')
                  .update({
                    draft_reply_text: replyText,
                    draft_reply_status: "pending"
                  })
                  .eq('id', review.id);
                generatedReplies++;
              }
              await delay(3000); // 3 second delay
            } catch (err: any) {
              console.error(`Error generating reply ${review.id}:`, err.message);
              continue;
            }
          }
        }
      }

      // --- PART 3: Seasonal Posts ---
      const { data: seasonRule } = await supabase
        .from('automation_rules')
        .select('is_active, config')
        .eq('business_id', business.id)
        .eq('rule_type', 'seasonal_calendar')
        .single();

      if (seasonRule && seasonRule.is_active) {
        const leadDays = seasonRule.config?.lead_days ?? 5;
        const upcoming = getUpcomingOccasions(leadDays);

        for (const occasion of upcoming) {
          try {
            const { data: existing } = await supabase
              .from('posts')
              .select('id')
              .eq('business_id', business.id)
              .eq('source_type', 'seasonal')
              .ilike('content', `%${occasion.name}%`)
              .maybeSingle();

            if (!existing) {
              const { text: content, usageMetadata: seasonalUsage } = await generateSeasonalPost({
                business: business,
                occasionName: occasion.name,
                occasionDate: occasion.date
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

              if (content) {
                const { url: suggestedImageUrl, usageMetadata: imageUsage } = await suggestImageForPost(content, business.id, supabase);

                if (imageUsage) {
                  await logUsage({
                    businessId: business.id,
                    actionType: 'ai_image_suggested',
                    promptTokens: imageUsage.promptTokenCount,
                    candidatesTokens: imageUsage.candidatesTokenCount,
                    metadata: { post_content_length: content.length }
                  });
                }

                await supabase.from('posts').insert({
                  business_id: business.id,
                  content,
                  source_type: 'seasonal',
                  status: 'pending_approval',
                  image_url: suggestedImageUrl
                });
                generatedSeasonal++;
                await delay(3000); // 3 second delay
              }
            }
          } catch (err: any) {
             console.error(`Error generating seasonal for ${business.id}:`, err.message);
             continue;
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      processedReviews, 
      generatedSeasonal,
      generatedReplies
    });
  } catch (error) {
    console.error("Generate Posts Cron Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
