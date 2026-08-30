"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateAutomationRule(
  businessId: string,
  ruleType: string,
  isActive: boolean,
  config: any
) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  // Verify business ownership
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .single();

  if (!business) {
    return { error: "Business not found or unauthorized" };
  }

  const { error } = await supabase
    .from("automation_rules")
    .upsert({
      business_id: businessId,
      rule_type: ruleType as any,
      is_active: isActive,
      config: config,
    }, { onConflict: 'business_id,rule_type' });

  if (error) {
    console.error("Error upserting automation rule:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/automation");
  return { success: true };
}
