import { GoogleGenAI } from '@google/genai';
import {
  REVIEW_TO_POST_PROMPT,
  SEASONAL_POST_PROMPT,
  MANUAL_POST_PROMPT,
  EVENT_POST_PROMPT
} from './prompts';
import { buildBusinessContext } from './context-builder';
import { Database } from '@/types/database';

type Business = Database["public"]["Tables"]["businesses"]["Row"];

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function generatePostFromReview(params: {
  business: Business;
  reviewerName: string;
  phrases: string[];
  rating: number;
  tone: string;
}): Promise<{ text: string; usageMetadata?: any }> {
  const contextBlock = buildBusinessContext(params.business);
  const prompt = REVIEW_TO_POST_PROMPT
    .replace('{businessContext}', contextBlock)
    .replace('{reviewerName}', params.reviewerName)
    .replace('{rating}', params.rating.toString())
    .replace('{tone}', params.tone)
    .replace('{phrases}', params.phrases.join(', '));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });
    return {
      text: response.text?.trim() ?? '',
      usageMetadata: response.usageMetadata,
    };
  } catch (error: any) {
    console.error("Gemini Generate Error:", error);
    if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("Quota")) {
      return {
        text: `[Mock AI Post - API Quota Reached]\nHey everyone! We just got a ${params.rating}-star review from ${params.reviewerName}. Come visit us at ${params.business.name} and see for yourself!`,
        usageMetadata: { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 },
      };
    }
    return { text: '' };
  }
}

export async function generateSeasonalPost(params: {
  business: Business;
  occasionName: string;
  occasionDate: string;
}): Promise<{ text: string; usageMetadata?: any }> {
  const contextBlock = buildBusinessContext(params.business);
  const prompt = SEASONAL_POST_PROMPT
    .replace('{businessContext}', contextBlock)
    .replace('{occasionName}', params.occasionName)
    .replace('{occasionDate}', params.occasionDate);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });
    return {
      text: response.text?.trim() ?? '',
      usageMetadata: response.usageMetadata,
    };
  } catch (error) {
    console.error("Gemini Generate Error:", error);
    return { text: '' };
  }
}

export async function generateManualPost(params: {
  business: Business;
  context: string;
  tone: string;
}): Promise<{ text: string; usageMetadata?: any }> {
  const contextBlock = buildBusinessContext(params.business);
  const prompt = MANUAL_POST_PROMPT
    .replace('{businessContext}', contextBlock)
    .replace('{context}', params.context)
    .replace('{tone}', params.tone);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });
    return {
      text: response.text?.trim() ?? '',
      usageMetadata: response.usageMetadata,
    };
  } catch (error) {
    console.error("Gemini Generate Error:", error);
    return { text: '' };
  }
}

export async function generateEventPost(params: {
  business: Business;
  eventName: string;
  eventDate: string;
}): Promise<{ text: string; usageMetadata?: any }> {
  const contextBlock = buildBusinessContext(params.business);
  const prompt = EVENT_POST_PROMPT
    .replace('{businessContext}', contextBlock)
    .replace('{eventName}', params.eventName)
    .replace('{eventDate}', params.eventDate);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });
    return {
      text: response.text?.trim() ?? '',
      usageMetadata: response.usageMetadata,
    };
  } catch (error) {
    console.error("Gemini Generate Error:", error);
    return { text: '' };
  }
}

export async function suggestImageForPost(
  postContent: string,
  businessId: string,
  supabase: any
): Promise<{ url: string | null; usageMetadata?: any }> {
  try {
    // 1. Fetch active images for the business
    const { data: images, error } = await supabase
      .from("business_images")
      .select("url, label")
      .eq("business_id", businessId)
      .eq("is_active", true);

    if (error || !images || images.length === 0) {
      return { url: null };
    }

    // Filter out images without labels
    const labeledImages = images.filter((img: any) => img.label && img.label.trim() !== "");
    if (labeledImages.length === 0) {
      return { url: null };
    }

    // Get unique labels list
    const labels = Array.from(new Set(labeledImages.map((img: any) => img.label.trim())));

    const prompt = `Here is a Google Business Profile post:
"${postContent}"

Here are the available images with their labels:
${labels.join(", ")}

Which image label is most relevant to this post?
Return only the label text, nothing else. If none of the labels are relevant, return "none".`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const chosenLabel = response.text?.trim()?.toLowerCase() ?? '';
    if (!chosenLabel || chosenLabel === "none") {
      return { url: null, usageMetadata: response.usageMetadata };
    }

    // Try to find the image that matches the chosenLabel (case insensitive)
    const matchedImage = labeledImages.find(
      (img: any) => img.label.trim().toLowerCase() === chosenLabel
    );

    // If exact match not found, do a substring or fallback match
    if (matchedImage) {
      return { url: matchedImage.url, usageMetadata: response.usageMetadata };
    }

    // Check if any of our labels are contained in or equal to the chosen label
    const fuzzyMatch = labeledImages.find(
      (img: any) => chosenLabel.includes(img.label.trim().toLowerCase()) || img.label.trim().toLowerCase().includes(chosenLabel)
    );

    return { url: fuzzyMatch ? fuzzyMatch.url : null, usageMetadata: response.usageMetadata };
  } catch (error) {
    console.error("Error in suggestImageForPost:", error);
    return { url: null };
  }
}

