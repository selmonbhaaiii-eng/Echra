import { FormData } from "./OnboardingWizard";

export function StepOne({
  formData,
  update,
}: {
  formData: FormData;
  update: (d: Partial<FormData>) => void;
}) {
  const roles = [
    { id: "owner", label: "👑 Owner" },
    { id: "manager", label: "👔 Manager" },
    { id: "marketing", label: "📱 Marketing person" },
    { id: "agency", label: "👥 Agency managing this account" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-syne text-lp-text mb-2">
          First, tell us about yourself
        </h1>
        <p className="text-lp-text2">
          This helps us write posts that sound like you. Takes 30 seconds.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-lp-text2 mb-2">
            Your first name <span className="text-lp-red">*</span>
          </label>
          <input
            type="text"
            value={formData.owner_name}
            onChange={(e) => update({ owner_name: e.target.value })}
            placeholder="e.g. Kiran"
            className="w-full bg-lp-surface2 border border-lp-border2 rounded-lg px-4 py-2 text-lp-text focus:outline-none focus:border-lp-accent transition-colors"
          />
          <p className="text-xs text-lp-text2 mt-1">
            Used in posts — "Kiran here!" feels more personal than "The Management".
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-lp-text2 mb-3">
            Your role
          </label>
          <div className="flex flex-wrap gap-3">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => update({ owner_role: role.id })}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  formData.owner_role === role.id
                    ? "bg-lp-accent/10 border-lp-accent/30 text-lp-accent"
                    : "bg-lp-surface2 border-lp-border2 text-lp-text2 hover:text-lp-text"
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
