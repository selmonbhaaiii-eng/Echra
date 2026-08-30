import { ClientSidebar } from "@/components/dashboard/ClientSidebar";
import { createClient } from "@/lib/supabase/server";
import { SyncGBPProfileButton } from "@/components/dashboard/SyncGBPProfileButton";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let pendingCount = 0;
  let contextPercent = 0;
  let isGbpConnected = false;
  let gbpLocationName = "";
  let businessId = "";

  if (user) {
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, context_completion_percent, gbp_connected")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();

    if (business) {
      businessId = business.id;
      isGbpConnected = business.gbp_connected || false;
      gbpLocationName = business.name || "Your Business";
      const { count } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("business_id", business.id)
        .eq("status", "pending_approval");
      pendingCount = count || 0;
      contextPercent = business.context_completion_percent || 0;
    }
  }

  return (
    <div className="min-h-screen bg-lp-bg text-lp-text">
      <ClientSidebar pendingCount={pendingCount} contextPercent={contextPercent} />
      <div className="ml-[220px] min-h-screen">
        <header className="sticky top-0 z-30 flex h-[52px] items-center justify-between border-b border-lp-border bg-lp-bg/90 px-6 backdrop-blur-xl">
          <p className="text-[11px] font-bold uppercase tracking-widest text-lp-text3">
            Business Dashboard
          </p>
          <div className={`flex items-center rounded-full border pl-3 pr-2 py-1 text-xs font-medium ${isGbpConnected ? 'border-lp-accent/30 bg-lp-accent/10 text-lp-accent' : 'border-lp-border bg-lp-surface text-lp-text2'}`}>
            {isGbpConnected ? `Connected: ${gbpLocationName}` : "GBP not connected"}
            {isGbpConnected && businessId && <SyncGBPProfileButton businessId={businessId} />}
          </div>
        </header>
        <main className="px-6 py-7">{children}</main>
      </div>
    </div>
  );
}



