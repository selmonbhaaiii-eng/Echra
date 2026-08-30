import { ReviewsPage } from "@/components/dashboard/ReviewsPage";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ReviewsRoutePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: business } = user
    ? await supabase
        .from("businesses")
        .select("id,gbp_connected,avg_rating,total_reviews")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle()
    : { data: null };

  const { data: reviews } = business
    ? await supabase
        .from("reviews")
        .select("*, posts!posts_source_review_id_fkey(*)")
        .eq("business_id", business.id)
        .order("review_date", { ascending: false })
    : { data: [] };

  return <ReviewsPage business={business} reviews={(reviews ?? []) as any} />;
}
