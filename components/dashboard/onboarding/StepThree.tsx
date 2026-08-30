import { FormData } from "./OnboardingWizard";

export function StepThree({
  formData,
  update,
}: {
  formData: FormData;
  update: (d: Partial<FormData>) => void;
}) {
  const customerTypes = [
    { id: "young_professionals", label: "👔 Young professionals" },
    { id: "families", label: "👨‍👩‍👧 Families with kids" },
    { id: "students", label: "🎓 Students" },
    { id: "corporate", label: "🏢 Corporate clients" },
    { id: "tourists", label: "✈️ Tourists and visitors" },
    { id: "seniors", label: "👴 Senior citizens" },
    { id: "locals", label: "🏘️ Local neighbourhood regulars" },
  ];

  const toggleCustomerType = (id: string) => {
    const isSelected = formData.customer_type.includes(id);
    if (isSelected) {
      update({
        customer_type: formData.customer_type.filter((t) => t !== id),
      });
    } else {
      update({
        customer_type: [...formData.customer_type, id],
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-syne text-lp-text mb-2">
          Who are your customers?
        </h1>
        <p className="text-lp-text2">
          Helps us write posts that speak to the right people.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-lp-text2 mb-3">
            Who is your typical customer? (Select all that apply)
          </label>
          <div className="flex flex-wrap gap-2 text-sm">
            {customerTypes.map((type) => {
              const isSelected = formData.customer_type.includes(type.id);
              return (
                <button
                  key={type.id}
                  onClick={() => toggleCustomerType(type.id)}
                  className={`px-4 py-2 rounded-full border transition-colors ${
                    isSelected
                      ? "bg-lp-accent/10 border-lp-accent text-lp-accent"
                      : "bg-lp-surface2 border-lp-border2 text-lp-text2 hover:text-lp-text"
                  }`}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-lp-text2 mb-2">
            Which areas do most customers come from?
          </label>
          <input
            type="text"
            value={formData.local_area}
            onChange={(e) => update({ local_area: e.target.value })}
            placeholder="e.g. Bandra, Khar, Santacruz"
            className="w-full bg-lp-surface2 border border-lp-border2 rounded-lg px-4 py-2 text-lp-text focus:outline-none focus:border-lp-accent transition-colors"
          />
          <p className="text-xs text-lp-text2 mt-1">
            City areas or neighbourhoods — makes posts feel hyper local
          </p>
        </div>
      </div>
    </div>
  );
}
