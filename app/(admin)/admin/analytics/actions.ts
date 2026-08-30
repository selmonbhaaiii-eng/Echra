"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { sendReminderEmail } from "@/lib/notifications/reminder-email";

export async function sendReminder(
  businessId: string,
  alertType: "never_connected_gbp" | "idle_client" | "posts_waiting_approval"
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Unauthorized" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return { ok: false, error: "Unauthorized access" };
    }

    const service = createServiceRoleClient();
    // Query business and the owner profile
    const { data: business } = await service
      .from("businesses")
      .select("name, owner_id, owner:profiles(email, full_name)")
      .eq("id", businessId)
      .single();

    if (!business) {
      return { ok: false, error: "Business not found" };
    }

    const owner = business.owner as any;
    const toEmail = owner?.email;
    const ownerName = owner?.full_name || "Business Owner";

    if (!toEmail) {
      return { ok: false, error: "Owner email address not found" };
    }

    const result = await sendReminderEmail({
      to: toEmail,
      ownerName,
      businessName: business.name,
      alertType,
    });

    if (result.skipped) {
      return { ok: false, error: "Email sending skipped (check Resend API key setup)" };
    }

    return { ok: true };
  } catch (error: any) {
    console.error("Error in sendReminder server action:", error);
    return { ok: false, error: error.message || "Failed to send reminder" };
  }
}
