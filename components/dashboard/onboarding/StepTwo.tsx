import { FormData } from "./OnboardingWizard";

export function StepTwo({
  formData,
  update,
}: {
  formData: FormData;
  update: (d: Partial<FormData>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-syne text-lp-text mb-2">
          Tell us about your business
        </h1>
        <p className="text-lp-text2">
          The more you share, the better your posts.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-lp-text2 mb-2">
            Describe your business <span className="text-red">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => update({ description: e.target.value })}
            rows={3}
            maxLength={300}
            placeholder="We are a 10-year-old family bakery known for our sourdough and vegan options. Pet friendly. Open since 7am every day."
            className="w-full bg-lp-surface2 border border-lp-border2 rounded-lg px-4 py-3 text-lp-text focus:outline-none focus:border-lp-accent transition-colors resize-none"
          />
          <div className="flex justify-between mt-1 text-xs text-lp-text2">
            <span>Write like you would explain it to a friend</span>
            <span>{formData.description.length}/300</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-lp-text2 mb-2">
            Your top 3 products or services
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <span className="block text-xs text-lp-text2 mb-1">
                  #{i + 1} {i === 0 && "(most popular)"}
                </span>
                <input
                  type="text"
                  value={formData.top_products[i] || ""}
                  onChange={(e) => {
                    const newProducts = [...formData.top_products];
                    newProducts[i] = e.target.value;
                    update({ top_products: newProducts });
                  }}
                  placeholder={
                    i === 0
                      ? "Sourdough loaf"
                      : i === 1
                      ? "Cold brew"
                      : "Almond croissant"
                  }
                  className="w-full bg-lp-surface2 border border-lp-border2 rounded-lg px-3 py-2 text-lp-text focus:outline-none focus:border-lp-accent transition-colors"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-lp-text2 mt-1">
            What do customers come specifically for?
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-lp-text2 mb-2">
            What makes you different?
          </label>
          <textarea
            value={formData.usp}
            onChange={(e) => update({ usp: e.target.value })}
            rows={2}
            placeholder="Only fully vegan bakery in Bandra. We bake fresh every morning at 5am."
            className="w-full bg-lp-surface2 border border-lp-border2 rounded-lg px-4 py-3 text-lp-text focus:outline-none focus:border-lp-accent transition-colors resize-none"
          />
          <p className="text-xs text-lp-text2 mt-1">
            Why should someone choose you over the competitor next door?
          </p>
        </div>
      </div>
    </div>
  );
}
