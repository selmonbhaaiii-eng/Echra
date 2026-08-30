import { createClient } from "@supabase/supabase-js";

function calculateProfileCompleteness(business: any) {
  let score = 0;
  if (business.name) score += 20;
  if (business.category) score += 20;
  if (business.location) score += 20;
  if (business.gbp_connected) score += 40;
  return score;
}

export async function calculateHealthScore(businessId: string): Promise<number> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: posts } = await supabase
    .from("posts")
    .select("id")
    .eq("business_id", businessId)
    .eq("status", "published")
    .gte("published_at", thirtyDaysAgo);

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, reply_text")
    .eq("business_id", businessId);

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();

  const postFrequency = Math.min(((posts?.length ?? 0) / 12) * 100, 100);

  const reviewResponseRate =
    reviews && reviews.length > 0
      ? (reviews.filter((r) => r.reply_text).length / reviews.length) * 100
      : 0;

  const profileComplete = calculateProfileCompleteness(business);

  const score = Math.round(
    postFrequency * 0.4 + reviewResponseRate * 0.3 + profileComplete * 0.3
  );

  await supabase
    .from("businesses")
    .update({
      health_score: score,
    })
    .eq("id", businessId);

  return score;
}
