import Link from "next/link";
import { ArrowRight, Building2, MessageSquareText, RadioTower, ReceiptText, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MiniCalendar } from "@/components/dashboard/MiniCalendar";

export const dynamic = "force-dynamic";

function moneyForPlan(plan: string | null | undefined) {
  if (plan === "agency") {
    return 4999;
  }
  if (plan === "growth") {
    return 1999;
  }
  if (plan === "starter") {
    return 799;
  }

  return 0;
}

export default async function AdminPage() {
  const supabase = createClient();
  const [{ data: businesses }, { data: allPosts }] = await Promise.all([
    supabase
      .from("businesses")
      .select("id,name,location,plan,plan_status,health_score,posts_this_month,total_reviews")
      .order("created_at", { ascending: false }),
    supabase
      .from("posts")
      .select("id,source_type,status,scheduled_at,created_at")
      .order("created_at", { ascending: false })
      .limit(500)
  ]);

  const clients = businesses ?? [];
  const recentClients = clients.slice(0, 5);
  const mrr = clients.reduce((sum, business) => sum + moneyForPlan(business.plan), 0);
  const posts = clients.reduce((sum, business) => sum + (business.posts_this_month ?? 0), 0);
  const reviewsSynced = clients.reduce((sum, business) => sum + (business.total_reviews ?? 0), 0);
  const averageHealth = clients.length
    ? Math.round(
        clients.reduce((sum, business) => sum + (business.health_score ?? 0), 0) / clients.length,
      )
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-lp-accent">Admin</p>
          <h1 className="mt-2 font-heading text-4xl font-extrabold text-lp-text">Dashboard</h1>
          <p className="mt-2 text-sm text-lp-text2">
            A quick founder view of Echra clients, revenue, and automation readiness.
          </p>
        </div>
        <Link
          href="/admin/clients"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-lp-accent px-4 text-sm font-bold text-lp-bg transition hover:brightness-95"
        >
          View clients
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Clients", value: clients.length, icon: Building2, accent: "bg-lp-accent" },
          { label: "Monthly MRR", value: `₹${mrr.toLocaleString()}`, icon: ReceiptText, accent: "bg-lp-accent3" },
          { label: "Posts This Month", value: posts, icon: Sparkles, accent: "bg-lp-accent2" },
          { label: "Reviews Synced", value: reviewsSynced, icon: MessageSquareText, accent: "bg-lp-accent" },
          { label: "Avg Health", value: averageHealth, icon: RadioTower, accent: "bg-lp-red" },
        ].map((stat) => {
          const Icon = stat.icon;

          return (
            <div key={stat.label} className="overflow-hidden rounded-xl border border-lp-border bg-lp-surface">
              <div className={`h-0.5 ${stat.accent}`} />
              <div className="p-5">
                <div className="mb-4 flex size-9 items-center justify-center rounded-lg bg-lp-surface2 text-lp-text2">
                  <Icon className="size-4" />
                </div>
                <p className="text-sm font-medium text-lp-text2">{stat.label}</p>
                <p className="mt-3 font-heading text-3xl font-bold text-lp-text">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-lp-border bg-lp-surface p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-heading text-2xl font-bold text-lp-text">Recent Clients</h2>
            <Link href="/admin/clients" className="text-sm font-bold text-lp-accent">
              Manage all
            </Link>
          </div>

          {recentClients.length ? (
            <div className="divide-y divide-lp-border">
              {recentClients.map((business) => (
                <div key={business.id} className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="font-bold text-lp-text">{business.name}</p>
                    <p className="mt-1 text-sm text-lp-text2">{business.location ?? "No location"}</p>
                  </div>
                  <span className="rounded-full border border-lp-border bg-lp-surface2 px-2.5 py-1 text-xs font-bold uppercase text-lp-text2">
                    {business.plan ?? "trial"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-lp-border2 bg-lp-bg/40 p-8 text-center">
              <p className="font-heading text-xl font-bold text-lp-text">No client activity yet</p>
              <p className="mt-2 text-sm text-lp-text2">Add your first client from the Clients page.</p>
            </div>
          )}
        </div>

        <MiniCalendar posts={(allPosts || []).map(p => ({
          id: p.id,
          source_type: p.source_type ?? "manual",
          status: p.status ?? "draft",
          scheduled_at: p.scheduled_at,
          created_at: p.created_at ?? new Date().toISOString()
        }))} />
      </section>
    </div>
  );
}
