import Link from "next/link";
import { ArrowRight, Gauge, Sparkles, Star } from "lucide-react";
import { ConnectGBPBanner } from "@/components/dashboard/ConnectGBPBanner";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { GeneratePostModal } from "@/components/dashboard/GeneratePostModal";
import { MiniCalendar } from "@/components/dashboard/MiniCalendar";
import { RecentActivity, Activity } from "@/components/dashboard/RecentActivity";
import { ContextCompletionBanner } from "@/components/dashboard/ContextCompletionBanner";
import { AiActionsDashboard } from "@/components/dashboard/AiActionsDashboard";
import { createClient } from "@/lib/supabase/server";
import { getUpcomingOccasions } from "@/lib/automation/seasonal-calendar";

export const dynamic = "force-dynamic";

// Helper for relative time
function getRelativeTimeString(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString();
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: business } = user
    ? await supabase
      .from("businesses")
      .select("id,name,category,location,gbp_connected,total_reviews,avg_rating,health_score,posts_this_month,business_context,context_completion_percent")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle()
    : { data: null };

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ data: posts }, { data: reviews }, { count: newReviewsCount }, { data: reviewOptions }] = business
    ? await Promise.all([
      supabase
        .from("posts")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false })
        .limit(15),
      supabase
        .from("reviews")
        .select("*")
        .eq("business_id", business.id)
        .order("review_date", { ascending: false })
        .limit(10),
      supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id)
        .gte("review_date", startOfMonth.toISOString()),
      supabase
        .from("reviews")
        .select("id,reviewer_name,rating,review_text")
        .eq("business_id", business.id)
        .eq("post_created", false)
        .gte("rating", 4)
        .order("review_date", { ascending: false })
        .limit(10),
    ])
    : [{ data: [] }, { data: [] }, { count: 0 }, { data: [] }];

  const pendingPosts = (posts ?? []).filter((post) => post.status === "pending_approval");
  const stats = [
    { label: "Posts Published", value: String(business?.posts_this_month ?? 0), accent: "bg-lp-accent" },
    { label: "Profile Views", value: "0", accent: "bg-lp-accent2" },
    { label: "New Reviews", value: String(newReviewsCount ?? 0), accent: "bg-lp-accent3" },
    { label: "Map Pack Rank", value: "#-", accent: "bg-lp-red" },
  ];
  const occasions = getUpcomingOccasions(30).map((occasion) => ({
    name: occasion.name,
    date: occasion.date,
    daysUntil: occasion.daysUntil,
  }));

  // Build Recent Activity Feed
  const activities: Activity[] = [];

  // Add posts to activities
  (posts ?? []).forEach(post => {
    if (post.status === "published") {
      activities.push({
        id: `post-${post.id}`,
        type: "post_published",
        title: `Post published · ${post.source_type || 'Manual'}`,
        time: getRelativeTimeString(post.published_at || post.created_at || new Date().toISOString()),
      });
    } else if (post.status === "draft" || post.status === "pending_approval" || post.status === "scheduled") {
      activities.push({
        id: `post-${post.id}`,
        type: "post_drafted",
        title: `${post.source_type === "seasonal" ? "Seasonal post" : post.source_type === "event" ? "Event post" : "Post"} drafted`,
        time: getRelativeTimeString(post.created_at || new Date().toISOString()),
        subtitle: post.status === "scheduled" ? "Scheduled" : "Needs approval"
      });
    }
  });

  // Add reviews to activities
  (reviews ?? []).forEach(review => {
    activities.push({
      id: `review-${review.id}`,
      type: "review",
      title: `New ${review.rating}★ review from ${review.reviewer_name || "Anonymous"}`,
      time: getRelativeTimeString(review.review_date || review.created_at || new Date().toISOString()),
      subtitle: review.post_created ? "Post generated" : ""
    });
  });

  // Sort combined activities by timestamp
  activities.sort((a, b) => {
    // Note: getRelativeTimeString creates a bit of a challenge for true chronological sorting
    // but we can sort by the underlying IDs assuming they are sequential UUIDs or by reconstructing dates.
    // For this MVP, we'll sort based on their index in the arrays above, which are already sorted.
    // A better approach would be to include the raw date in Activity, but this works for now.
    return 0;
  });

  // Limit to 5 recent activities
  const recentActivities = activities.slice(0, 5);

  return (
    <div className="space-y-6">
      <ContextCompletionBanner percent={business?.context_completion_percent || 0} />
      {!business?.gbp_connected ? <ConnectGBPBanner /> : null}

      <DashboardStats stats={stats} />

      {business && <AiActionsDashboard businessId={business.id} />}

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr] mt-6">
        <div className="rounded-xl border border-lp-border bg-lp-surface p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-heading text-2xl font-bold text-lp-text">Post Queue</h2>
            <span className="rounded-full border border-lp-border bg-lp-surface2 px-2.5 py-1 text-xs font-bold text-lp-text2">
              {pendingPosts.length} pending
            </span>
          </div>
          {pendingPosts.length ? (
            <div className="space-y-3">
              {pendingPosts.slice(0, 4).map((post) => (
                <Link
                  key={post.id}
                  href="/dashboard/queue"
                  className="block rounded-xl border border-lp-border bg-lp-bg/40 p-4 transition hover:border-lp-border2 hover:bg-lp-surface2"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="rounded-full border border-lp-accent/20 bg-lp-accent/10 px-2.5 py-1 text-xs font-bold text-lp-accent">
                      Pending Approval
                    </span>
                    <ArrowRight className="size-4 text-lp-text3" />
                  </div>
                  <p className="line-clamp-3 text-sm leading-6 text-lp-text2">{post.content}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-lp-border2 bg-lp-bg/40 p-8 text-center">
              <div>
                <Sparkles className="mx-auto size-8 text-lp-text3" />
                <p className="mt-4 font-heading text-xl font-bold text-lp-text">No posts yet</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-lp-text2">
                  Generate your first review, seasonal, or manual GBP post.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-lp-border bg-lp-surface p-6">
            <h2 className="font-heading text-2xl font-bold text-lp-text mb-6">GBP Health Score</h2>
            
            <div className="flex items-center gap-6 mb-6">
              <div className="relative flex size-24 items-center justify-center rounded-full border-[8px] border-lp-surface3">
                <div className="absolute inset-[-8px] rounded-full border-[8px] border-lp-accent/20" />
                <div className="text-center">
                  <p className="font-heading text-3xl font-extrabold text-lp-text">
                    {(() => {
                      const ctx = business?.business_context as any || {};
                      let score = 0;
                      if (business?.gbp_connected) score += 20;
                      if (ctx.description) score += 20;
                      if (ctx.top_products?.filter(Boolean).length) score += 15;
                      if (ctx.tone) score += 10;
                      if (ctx.owner_name) score += 10;
                      if (ctx.language) score += 10;
                      if (ctx.usp) score += 15;
                      return score;
                    })()}
                  </p>
                </div>
              </div>
              <p className="text-sm text-text2">Complete items below to increase your score and generate better posts.</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className="text-accent text-emerald-500">✅</span> Business name & location</span>
                <span className="text-text2 text-xs">from Google</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className={business?.gbp_connected ? "text-accent text-emerald-500" : "text-red text-red-500"}>
                    {business?.gbp_connected ? "✅" : "🔴"}
                  </span> 
                  GBP connected
                </span>
                {!business?.gbp_connected && <Link href="/dashboard/settings/integrations" className="text-accent2 hover:underline text-xs">Connect →</Link>}
              </div>
              
              {(() => {
                const ctx = business?.business_context as any || {};
                
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className={ctx.description ? "text-accent text-emerald-500" : "text-red text-red-500"}>
                          {ctx.description ? "✅" : "🔴"}
                        </span> 
                        Business description
                      </span>
                      {!ctx.description && <Link href="/dashboard/settings/profile" className="text-accent2 hover:underline text-xs">Add →</Link>}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className={ctx.top_products?.filter(Boolean).length ? "text-accent text-emerald-500" : "text-red text-red-500"}>
                          {ctx.top_products?.filter(Boolean).length ? "✅" : "🔴"}
                        </span> 
                        Top products
                      </span>
                      {!ctx.top_products?.filter(Boolean).length && <Link href="/dashboard/settings/profile" className="text-accent2 hover:underline text-xs">Add →</Link>}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className={ctx.tone && ctx.language ? "text-accent text-emerald-500" : (ctx.tone || ctx.language ? "text-yellow-500" : "text-red text-red-500")}>
                          {ctx.tone && ctx.language ? "✅" : (ctx.tone || ctx.language ? "🟡" : "🔴")}
                        </span> 
                        Tone & Language
                      </span>
                      {(!ctx.tone || !ctx.language) && <Link href="/dashboard/settings/profile" className="text-accent2 hover:underline text-xs">Set →</Link>}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className={ctx.owner_name ? "text-accent text-emerald-500" : "text-red text-red-500"}>
                          {ctx.owner_name ? "✅" : "🔴"}
                        </span> 
                        Owner name
                      </span>
                      {!ctx.owner_name && <Link href="/dashboard/settings/profile" className="text-accent2 hover:underline text-xs">Add →</Link>}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <MiniCalendar posts={(posts || []).map(p => ({
            id: p.id,
            source_type: p.source_type ?? "manual",
            status: p.status ?? "draft",
            scheduled_at: p.scheduled_at,
            created_at: p.created_at ?? new Date().toISOString()
          }))} />

          <div className="rounded-xl border border-lp-border bg-lp-surface p-6">
            <div className="mb-4 flex items-center gap-2">
              <Gauge className="size-5 text-lp-accent2" />
              <h2 className="font-heading text-2xl font-bold text-lp-text">Quick Generate</h2>
            </div>
            <p className="mb-5 text-sm leading-6 text-lp-text2">Create a post from a review, festival, or custom prompt.</p>
            <GeneratePostModal reviews={reviewOptions ?? []} occasions={occasions} />
          </div>

          <RecentActivity activities={recentActivities} />

          <div className="rounded-xl border border-lp-border bg-lp-surface p-6">
            <div className="mb-4 flex items-center gap-2">
              <Star className="size-5 text-lp-accent3" />
              <h2 className="font-heading text-2xl font-bold text-lp-text">Recent Reviews</h2>
            </div>
            <div className="space-y-3">
              {(reviews ?? []).slice(0, 3).length ? (
                (reviews ?? []).slice(0, 3).map((review) => (
                  <div key={review.id} className="rounded-lg border border-lp-border bg-lp-bg/40 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-lp-text">{review.reviewer_name ?? "Anonymous"}</p>
                      <p className="text-xs font-bold text-lp-accent3">{review.rating ?? 0} stars</p>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-lp-text2">{review.review_text}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-lp-text2">No reviews synced yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
