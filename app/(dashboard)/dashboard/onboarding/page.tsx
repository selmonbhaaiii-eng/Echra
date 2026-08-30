import { OnboardingWizard } from "@/components/dashboard/onboarding/OnboardingWizard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Complete Your Profile | Echra",
};

export default async function OnboardingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("context_completed")
    .eq("owner_id", user.id)
    .single();

  if (business?.context_completed) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#0C0E0F]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OnboardingWizard />
      </div>
    </div>
  );
}
