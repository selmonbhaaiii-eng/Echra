import { createServiceRoleClient } from "../supabase/server";

/**
 * Calculates the estimated cost of a Gemini 1.5 Flash API call in USD.
 * Gemini 1.5 Flash pricing:
 * - Input tokens: $0.075 / 1,000,000 tokens
 * - Output tokens: $0.30 / 1,000,000 tokens
 */
export function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCostPer1M = 0.075;
  const outputCostPer1M = 0.30;
  return (
    ((inputTokens || 0) / 1_000_000) * inputCostPer1M +
    ((outputTokens || 0) / 1_000_000) * outputCostPer1M
  );
}

interface LogUsageParams {
  businessId: string;
  actionType: string;
  tokensUsed?: number;
  promptTokens?: number;
  candidatesTokens?: number;
  cost_usd?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
}

/**
 * Logs an action to the public.usage_logs table.
 */
export async function logUsage({
  businessId,
  actionType,
  tokensUsed = 0,
  promptTokens = 0,
  candidatesTokens = 0,
  cost_usd,
  metadata = {},
}: LogUsageParams): Promise<void> {
  const supabase = createServiceRoleClient();
  const calculatedTokens = tokensUsed || (promptTokens + candidatesTokens);
  const calculatedCost = cost_usd !== undefined ? cost_usd : calculateCost(promptTokens, candidatesTokens);

  try {
    const { error } = await supabase.from("usage_logs").insert({
      business_id: businessId,
      action_type: actionType,
      tokens_used: calculatedTokens,
      cost_usd: calculatedCost,
      metadata,
    });

    if (error) {
      console.error(`❌ Failed to insert usage log: ${error.message}`);
    } else {
      console.log(`✅ Logged usage: ${actionType} for business ${businessId}`);
    }
  } catch (err) {
    console.error("❌ Exception during logging usage:", err);
  }
}
