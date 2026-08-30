import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import {
  generatePostFromReview,
  generateSeasonalPost,
  generateManualPost,
  suggestImageForPost,
} from "@/lib/ai/generate-post";
import { extractPhrasesFromReview } from "@/lib/ai/extract-phrases";
import { sendPostGeneratedEmail } from "@/lib/notifications/email";
import { logUsage } from "@/lib/ai/logger";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, role")
      .eq("id", user.id)
      .single();

    const body = await request.json();
    const { source_type, review_id, context, tone, occasion_name, occasion_date, business_id, existing_post_id } = body;

    // Use passed business_id if admin, else default to user's business
    let targetBusinessId = business_id;

    if (!targetBusinessId) {
      const { data: userBusiness } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();
      targetBusinessId = userBusiness?.id;
    }

    if (!targetBusinessId) {
      return NextResponse.json({ error: "No business found" }, { status: 404 });
    }

    // Verify admin access if trying to act on another business
    const { data: business } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", targetBusinessId)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (business.owner_id !== user.id && profile?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access to business" }, { status: 403 });
    }

    let generatedContent = "";
    let sourceReviewId = null;
    let reviewerName = "";

    if (source_type === "review") {
      if (!review_id) {
        return NextResponse.json({ error: "Review ID required" }, { status: 400 });
      }

      const { data: review } = await supabase
        .from("reviews")
        .select("*")
        .eq("id", review_id)
        .eq("business_id", targetBusinessId)
        .single();

      if (!review) {
        return NextResponse.json({ error: "Review not found" }, { status: 404 });
      }

      sourceReviewId = review.id;
      reviewerName = review.reviewer_name || "a customer";

      let phrases = (review.extracted_phrases as any)?.phrases || [];
      if (!review.phrases_extracted || phrases.length === 0) {
        const { result: extractResult, usageMetadata: extractUsage } = await extractPhrasesFromReview(
          review.review_text || "",
          review.reviewer_name || "A customer",
          review.rating || 5
        );
        phrases = extractResult.phrases || [];

        await supabase
          .from("reviews")
          .update({
            extracted_phrases: extractResult,
            phrases_extracted: true,
          })
          .eq("id", review.id);

        if (extractUsage) {
          await logUsage({
            businessId: targetBusinessId,
            actionType: 'ai_phrases_extracted',
            promptTokens: extractUsage.promptTokenCount,
            candidatesTokens: extractUsage.candidatesTokenCount,
            metadata: { review_id: review.id }
          });
        }
      }

      const { text, usageMetadata } = await generatePostFromReview({
        business,
        reviewerName: review.reviewer_name || "A customer",
        phrases,
        rating: review.rating || 5,
        tone: tone || "Professional",
      });
      generatedContent = text;

      if (usageMetadata) {
        await logUsage({
          businessId: targetBusinessId,
          actionType: 'ai_post_generated',
          promptTokens: usageMetadata.promptTokenCount,
          candidatesTokens: usageMetadata.candidatesTokenCount,
          metadata: { source_type: source_type, review_id: sourceReviewId }
        });
      }

    } else if (source_type === "seasonal") {
      if (!occasion_name || !occasion_date) {
        return NextResponse.json({ error: "Occasion details required" }, { status: 400 });
      }

      const { text, usageMetadata } = await generateSeasonalPost({
        business,
        occasionName: occasion_name,
        occasionDate: occasion_date,
      });
      generatedContent = text;

      if (usageMetadata) {
        await logUsage({
          businessId: targetBusinessId,
          actionType: 'ai_post_generated',
          promptTokens: usageMetadata.promptTokenCount,
          candidatesTokens: usageMetadata.candidatesTokenCount,
          metadata: { source_type: source_type, occasion_name }
        });
      }

    } else if (source_type === "manual") {
      if (!context || !tone) {
        return NextResponse.json({ error: "Context and tone required" }, { status: 400 });
      }

      const { text, usageMetadata } = await generateManualPost({
        business,
        context,
        tone,
      });
      generatedContent = text;

      if (usageMetadata) {
        await logUsage({
          businessId: targetBusinessId,
          actionType: 'ai_post_generated',
          promptTokens: usageMetadata.promptTokenCount,
          candidatesTokens: usageMetadata.candidatesTokenCount,
          metadata: { source_type: source_type, context_length: context.length }
        });
      }
    } else {
      return NextResponse.json({ error: "Invalid source type" }, { status: 400 });
    }

    if (!generatedContent) {
      return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
    }

    let targetScheduledAt: string | null = null;
    if (source_type === "seasonal" && occasion_date) {
      const now = new Date();
      const [month, day] = occasion_date.split("-").map(Number);
      let d = new Date(now.getFullYear(), month - 1, day, 9, 0, 0, 0); // 9:00 AM local time
      
      if (d.getTime() < now.getTime()) {
        d = new Date(now.getFullYear() + 1, month - 1, day, 9, 0, 0, 0);
      }
      targetScheduledAt = d.toISOString();
    }

    const { url: suggestedImageUrl, usageMetadata: imageUsage } = await suggestImageForPost(generatedContent, targetBusinessId, supabase);

    if (imageUsage) {
      await logUsage({
        businessId: targetBusinessId,
        actionType: 'ai_image_suggested',
        promptTokens: imageUsage.promptTokenCount,
        candidatesTokens: imageUsage.candidatesTokenCount,
        metadata: { post_content_length: generatedContent.length }
      });
    }

    let newPost;
    let postError;

    if (existing_post_id) {
      const { data, error } = await supabase
        .from("posts")
        .update({
          content: generatedContent,
          source_type: source_type,
          source_review_id: sourceReviewId,
          scheduled_at: targetScheduledAt,
          image_url: suggestedImageUrl,
        })
        .eq("id", existing_post_id)
        .eq("business_id", targetBusinessId)
        .select()
        .single();
      newPost = data;
      postError = error;
    } else {
      const { data, error } = await supabase
        .from("posts")
        .insert({
          business_id: targetBusinessId,
          content: generatedContent,
          source_type: source_type,
          source_review_id: sourceReviewId,
          status: "pending_approval",
          scheduled_at: targetScheduledAt,
          image_url: suggestedImageUrl,
        })
        .select()
        .single();
      newPost = data;
      postError = error;
    }

    if (postError || !newPost) {
      console.error(postError);
      return NextResponse.json({ error: "Failed to save post" }, { status: 500 });
    }

    if (source_type === "review" && sourceReviewId) {
      const adminClient = createServiceRoleClient();
      const { error: reviewUpdateError } = await adminClient
        .from("reviews")
        .update({
          post_created: true,
          post_id: newPost.id,
        })
        .eq("id", sourceReviewId);
        
      if (reviewUpdateError) {
        console.error("Failed to update review status:", reviewUpdateError);
      }
    }

    // Get the actual business owner's email
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", business.owner_id || "")
      .maybeSingle();

    if (ownerProfile?.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await sendPostGeneratedEmail({
        clientEmail: ownerProfile.email,
        ownerName: ownerProfile.full_name || "Business Owner",
        businessName: business.name,
        postContent: generatedContent,
        reviewerName: reviewerName,
        dashboardUrl: `${appUrl}/dashboard/queue`,
      });
    }

    return NextResponse.json({ success: true, post: newPost });
  } catch (error) {
    console.error("Generate Post API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
