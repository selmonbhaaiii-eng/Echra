import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PostQueue } from "@/components/dashboard/PostQueue";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { getUpcomingOccasions } from "@/lib/automation/seasonal-calendar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminClientDashboard({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!business) {
    return (
      <div className="rounded-xl border border-dashed border-lp-border2 p-12 text-center">
        <p className="font-heading text-lg font-bold text-lp-text">Business Not Found</p>
        <Link href="/admin/clients" className="mt-4 text-sm text-lp-accent hover:underline">
          &larr; Back to Clients
        </Link>
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
    .gte("rating", 4)
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
    <div className="space-y-8">
      <div>
        <Link href="/admin/clients" className="inline-flex items-center gap-2 text-sm text-lp-text2 hover:text-lp-text mb-4">
          <ArrowLeft className="size-4" />
          Back to Clients
        </Link>
        <h1 className="font-heading text-3xl font-bold text-lp-text">{business.name}</h1>
        <p className="mt-2 text-lp-text2">Managing post queue and AI generation as Admin.</p>
      </div>

      <DashboardStats stats={stats} />

      <PostQueue 
        initialPosts={postsList as any} 
        reviews={reviewOptions || []} 
        occasions={occasions}
        businessId={business.id}
      />
    </div>
  );
}
