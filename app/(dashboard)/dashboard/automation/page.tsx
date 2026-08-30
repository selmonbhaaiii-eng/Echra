import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AutomationSettingsClient } from "./AutomationSettingsClient";

export const metadata = {
  title: "Automation Rules | Echra",
  description: "Control how Echra automatically works for your business",
};

export default async function AutomationPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get the user's business
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!business) {
    return (
      <div className="p-8">
        <h1 className="font-heading text-2xl font-bold text-lp-text">Automation Rules</h1>
        <p className="mt-2 text-lp-text2">Please complete onboarding first.</p>
      </div>
    );
  }

  // Fetch automation rules
  const { data: rules } = await supabase
    .from("automation_rules")
    .select("*")
    .eq("business_id", business.id);

  return (
    <div className="flex h-full flex-col">
      <header className="mb-8 border-b border-lp-border pb-6">
        <h1 className="font-heading text-3xl font-bold text-lp-text">Automation Rules</h1>
        <p className="mt-2 text-lg text-lp-text2">
          Control how Echra automatically works for your business
        </p>
      </header>

      <div className="flex-1 overflow-auto">
        <AutomationSettingsClient 
          businessId={business.id} 
          initialRules={(rules || []).map(r => ({
            ...r,
            rule_type: r.rule_type ?? "review_to_post"
          })) as any} 
        />
      </div>
    </div>
  );
}
