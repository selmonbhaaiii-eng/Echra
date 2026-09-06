import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PostQueue } from "@/components/dashboard/PostQueue";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { getUpcomingOccasions } from "@/lib/automation/seasonal-calendar";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!business) {
    return (
      <div className="rounded-xl border border-dashed border-lp-border2 p-12 text-center">
        <p className="font-heading text-lg font-bold text-lp-text">No Business Connected</p>
        <p className="mt-2 text-sm text-lp-text2">Connect your Google Business Profile to see the post queue.</p>
      </div>
    );
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("*, reviews!posts_source_review_id_fkey(reviewer_name, rating)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  const { data: reviewOptions } = await supabase
    .from("reviews")
    .select("id,reviewer_name,rating,review_text")
    .eq("business_id", business.id)
    .eq("post_created", false)
    .order("review_date", { ascending: false })
    .limit(10);

  const postsList = posts || [];
  
  const stats = [
    { 
      label: "Pending Approval", 
      value: String(postsList.filter(p => p.status === "pending_approval").length), 
      accent: "bg-lp-accent" 
    },
    { 
      label: "Published This Month", 
      value: String(business.posts_this_month || 0), 
      accent: "bg-blue-500" 
    },
    { 
      label: "Scheduled", 
      value: String(postsList.filter(p => p.status === "approved").length), 
      accent: "bg-emerald-500" 
    },
    { 
      label: "Drafts", 
      value: String(postsList.filter(p => p.status === "draft").length), 
      accent: "bg-lp-surface3" 
    },
  ];

  const occasions = getUpcomingOccasions(30).map((occasion) => ({
    name: occasion.name,
    date: occasion.date,
    daysUntil: occasion.daysUntil,
  }));

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-lp-text">Post Queue</h1>
        <p className="mt-1 sm:mt-2 text-sm text-lp-text2">Manage your AI-generated and scheduled posts.</p>
      </div>

      <DashboardStats stats={stats} />

      <PostQueue 
        initialPosts={postsList as any} 
        reviews={reviewOptions || []} 
        occasions={occasions}
      />
    </div>
  );
}
