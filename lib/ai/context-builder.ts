import { Database } from "@/types/database";

type Business = Database["public"]["Tables"]["businesses"]["Row"];

export function buildBusinessContext(business: Business): string {
  const ctx = (business.business_context as any) || {};

  // If no context filled yet use basic info only
  if (!ctx || Object.keys(ctx).length === 0) {
    return `
BUSINESS INFO:
Name: ${business.name}
Location: ${business.location}
Category: ${business.category}
Note: Business context not yet filled. Generate generic but professional content.
    `.trim();
  }

  const lines = [
    `BUSINESS CONTEXT (use this to personalize all content):`,
    `Business Name: ${business.name}`,
    `Location: ${business.location}`,
    `Category: ${business.category}`,
  ];

  if (ctx.owner_name) {
    lines.push(`Owner/Contact Name: ${ctx.owner_name}`);
  }
  if (ctx.owner_role) {
    lines.push(`Their role: ${ctx.owner_role}`);
  }
  if (ctx.description) {
    lines.push(`About the business: ${ctx.description}`);
  }
  if (ctx.top_products?.length) {
    lines.push(`Known for: ${ctx.top_products.join(", ")}`);
  }
  if (ctx.usp) {
    lines.push(`What makes them unique: ${ctx.usp}`);
  }
  if (ctx.customer_type?.length) {
    lines.push(`Their customers: ${ctx.customer_type.join(", ")}`);
  }
  if (ctx.local_area) {
    lines.push(`Local neighbourhood served: ${ctx.local_area}`);
  }
  if (ctx.tone) {
    const toneMap: Record<string, string> = {
      warm_friendly: "Warm and friendly — like talking to a neighbour",
      professional: "Professional and trustworthy",
      playful: "Playful, fun, uses emojis naturally",
      urgent: "Urgent and compelling",
      premium: "Premium and sophisticated",
      "Local language / Hinglish": "Hinglish — natural mix of Hindi and English words",
    };
    lines.push(`Preferred tone: ${toneMap[ctx.tone] || ctx.tone}`);
  }
  if (ctx.language) {
    const langMap: Record<string, string> = {
      english: "English only",
      hinglish: "Hinglish — natural mix of Hindi and English words",
      hindi: "Hindi only",
    };
    lines.push(`Language style: ${langMap[ctx.language] || ctx.language}`);
  }
  if (ctx.current_offers) {
    lines.push(`Current offers/promotions: ${ctx.current_offers}`);
  }
  if (ctx.never_mention) {
    lines.push(`NEVER mention in content: ${ctx.never_mention}`);
  }
  if (ctx.sensitive_topics) {
    lines.push(`Avoid these topics: ${ctx.sensitive_topics}`);
  }

  return lines.join("\n");
}

export function calculateContextCompletion(ctx: any): number {
  if (!ctx || Object.keys(ctx).length === 0) return 0;

  const fields = [
    "owner_name",
    "description",
    "top_products",
    "usp",
    "customer_type",
    "local_area",
    "tone",
    "language",
    "current_offers",
  ];

  const filled = fields.filter((f) => {
    const val = ctx[f];
    if (Array.isArray(val)) return val.length > 0;
    return val && val.toString().trim().length > 0;
  });

  return Math.round((filled.length / fields.length) * 100);
}
