import { AddClientModal } from "@/components/admin/AddClientModal";
import { ClientsTable, type AdminBusiness } from "@/components/admin/ClientsTable";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const statAccent = ["bg-lp-accent", "bg-lp-accent2", "bg-lp-accent3", "bg-lp-red"];

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

function StatCard({
  label,
  value,
  accentIndex,
}: {
  label: string;
  value: string;
  accentIndex: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-lp-border bg-lp-surface">
      <div className={`h-0.5 ${statAccent[accentIndex]}`} />
      <div className="p-3.5 sm:p-5">
        <p className="text-xs sm:text-sm font-medium text-lp-text2 truncate">{label}</p>
        <p className="mt-2 font-heading text-xl sm:text-3xl font-bold text-lp-text truncate">{value}</p>
      </div>
    </div>
  );
}

export default async function ClientsPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("businesses")
    .select(
      "id,name,category,location,gbp_location_id,gbp_connected,last_review_sync,total_reviews,plan,plan_status,health_score,posts_this_month,monthly_post_limit,owner:profiles(email,full_name)",
    )
    .order("created_at", { ascending: false });

  const businesses = (data ?? []) as AdminBusiness[];
  const activeClients = businesses.length;
  const totalGbps = businesses.reduce((sum) => sum + 1, 0);
  const monthlyMrr = businesses.reduce((sum, business) => sum + moneyForPlan(business.plan), 0);
  const postsPublished = businesses.reduce(
    (sum, business) => sum + (business.posts_this_month ?? 0),
    0,
  );
  const reviewsSynced = businesses.reduce((sum, business) => sum + (business.total_reviews ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-lp-accent">Admin</p>
          <h1 className="mt-1 sm:mt-2 font-heading text-2xl sm:text-4xl font-extrabold text-lp-text">Clients</h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-lp-text2">
            All connected businesses, billing signals, and posting health in one place.
          </p>
        </div>
        <AddClientModal />
      </div>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Active Clients" value={String(activeClients)} accentIndex={0} />
        <StatCard label="Total GBPs" value={String(totalGbps)} accentIndex={1} />
        <StatCard label="Monthly MRR" value={`₹${monthlyMrr.toLocaleString()}`} accentIndex={2} />
        <StatCard label="Posts Published" value={String(postsPublished)} accentIndex={3} />
        <StatCard label="Reviews Synced" value={String(reviewsSynced)} accentIndex={0} />
      </section>

      {error ? (
        <div className="rounded-xl border border-lp-red/30 bg-lp-red/10 p-4 text-sm text-lp-red">
          {error.message}
        </div>
      ) : null}

      <ClientsTable businesses={businesses} />
    </div>
  );
}
