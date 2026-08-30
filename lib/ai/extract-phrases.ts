import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export type ExtractResult = {
  phrases: string[];
  reputation_risk_type?: string;
};

export async function extractPhrasesFromReview(
  reviewText: string,
  reviewerName: string,
  rating: number
): Promise<{ result: ExtractResult; usageMetadata?: any }> {
  const isNegative = rating <= 3;

  const prompt = isNegative
    ? `Analyze this negative Google review for reputation risk.
If it involves a billing dispute, health/safety issue, rude staff complaint, or legal threat, summarize it into a 2-4 word classification string (e.g., "Service complaint", "Billing dispute", "Health & Safety"). If it's just a mild generic complaint, return an empty string.

Return ONLY a valid JSON object with this exact format:
{
  "phrases": [],
  "reputation_risk_type": "Classification string here or empty"
}

Reviewer: ${reviewerName}
Rating: ${rating} stars
Review: "${reviewText}"`
    : `Extract 2-3 specific, quotable phrases from this Google review that would make great content for a Google Business Profile post.

Rules:
- Only extract phrases the customer actually said
- Phrases must be specific (not generic like "great service")
- Each phrase should be 3-8 words maximum
- Return ONLY a valid JSON object with this exact format:
{
  "phrases": ["phrase one", "phrase two"],
  "reputation_risk_type": ""
}
- No explanation, just the JSON object

Reviewer: ${reviewerName}
Rating: ${rating} stars
Review: "${reviewText}"`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (!text) return { result: { phrases: [] }, usageMetadata: response.usageMetadata };
    
    return {
      result: JSON.parse(text) as ExtractResult,
      usageMetadata: response.usageMetadata,
    };
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    return { result: { phrases: [] } };
  }
}
