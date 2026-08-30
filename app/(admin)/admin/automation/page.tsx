import { AutomationSettings } from "@/components/admin/AutomationSettings";

export default function AutomationPage() {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-lp-text">Automation Rules</h1>
          <p className="mt-2 text-sm leading-6 text-lp-text2">
            Configure global defaults for the AI engine across all client accounts.
          </p>
        </div>
      </div>
      <AutomationSettings />
    </section>
  );
}
