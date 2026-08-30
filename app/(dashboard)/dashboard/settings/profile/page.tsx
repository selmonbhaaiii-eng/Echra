import { createClient } from "@/lib/supabase/server";
import { ProfileSettingsTabs } from "@/components/dashboard/ProfileSettingsTabs";

export const metadata = {
  title: "Profile Settings | Echra",
};

export default async function ProfileSettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initialData = {};
  let completionPercent = 0;
  let businessId = "";

  if (user) {
    const { data: business } = await supabase
      .from("businesses")
      .select("id, business_context, context_completion_percent")
      .eq("owner_id", user.id)
      .single();

    if (business) {
      businessId = business.id;
      initialData = business.business_context || {};
      completionPercent = business.context_completion_percent || 0;
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-syne text-white mb-2">Business Profile</h1>
        <p className="text-lp-text2">
          Manage your business details, tone, and preferences. These settings personalize your AI-generated posts and replies.
        </p>
      </div>

      <ProfileSettingsTabs
        businessId={businessId}
        initialData={initialData}
        initialPercent={completionPercent}
      />
    </div>
  );
}
