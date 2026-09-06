import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { createClient } from "@/lib/supabase/server";

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
    <DashboardShell
      pendingCount={pendingCount}
      contextPercent={contextPercent}
      isGbpConnected={isGbpConnected}
      gbpLocationName={gbpLocationName}
      businessId={businessId}
    >
      {children}
    </DashboardShell>
  );
}



