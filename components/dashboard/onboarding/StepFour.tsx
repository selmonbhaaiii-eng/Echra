import { FormData } from "./OnboardingWizard";

export function StepFour({
  formData,
  update,
}: {
  formData: FormData;
  update: (d: Partial<FormData>) => void;
}) {
  const tones = [
    {
      id: "warm_friendly",
      icon: "🤝",
      label: "Warm & Friendly",
      example: '"Hey neighbour! Come say hello today 😊"',
    },
    {
      id: "professional",
      icon: "💼",
      label: "Professional",
      example:
        '"We are committed to delivering quality service to every customer."',
    },
    {
      id: "playful",
      icon: "🎉",
      label: "Playful",
      example: '"Life\'s short. Eat the croissant. 🥐✨"',
    },
    {
      id: "premium",
      icon: "✨",
      label: "Premium",
      example: '"An experience crafted for the discerning palate."',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-syne text-lp-text mb-2">
          How should your posts sound?
        </h1>
        <p className="text-lp-text2">
          Set your brand voice once, used everywhere.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-lp-text2 mb-3">
            Post tone <span className="text-red">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tones.map((tone) => (
              <button
                key={tone.id}
                onClick={() => update({ tone: tone.id })}
                className={`flex flex-col text-left p-4 rounded-xl border transition-colors ${
                  formData.tone === tone.id
                    ? "bg-lp-accent/10 border-lp-accent"
                    : "bg-lp-surface2 border-lp-border2 hover:border-text2"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{tone.icon}</span>
                  <span
                    className={`font-medium ${
                      formData.tone === tone.id ? "text-lp-accent" : "text-lp-text"
                    }`}
                  >
                    {tone.label}
                  </span>
                </div>
                <span className="text-xs text-lp-text2 italic">
                  {tone.example}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-lp-text2 mb-3">
            Language style <span className="text-red">*</span>
          </label>
          <div className="flex flex-wrap gap-2 text-sm mb-3">
            <button
              onClick={() => update({ language: "english" })}
              className={`px-4 py-2 rounded-full border transition-colors ${
                formData.language === "english"
                  ? "bg-lp-accent/10 border-lp-accent text-lp-accent"
                  : "bg-lp-surface2 border-lp-border2 text-lp-text2 hover:text-lp-text"
              }`}
            >
              🇬🇧 English only
            </button>
            <button
              onClick={() => update({ language: "hinglish" })}
              className={`px-4 py-2 rounded-full border transition-colors ${
                formData.language === "hinglish"
                  ? "bg-lp-accent/10 border-lp-accent text-lp-accent"
                  : "bg-lp-surface2 border-lp-border2 text-lp-text2 hover:text-lp-text"
              }`}
            >
              🇮🇳 Hinglish (Recommended)
            </button>
            <button
              onClick={() => update({ language: "hindi" })}
              className={`px-4 py-2 rounded-full border transition-colors ${
                formData.language === "hindi"
                  ? "bg-lp-accent/10 border-lp-accent text-lp-accent"
                  : "bg-lp-surface2 border-lp-border2 text-lp-text2 hover:text-lp-text"
              }`}
            >
              हि Hindi only
            </button>
          </div>
          <div className="bg-lp-surface3 p-3 rounded-lg border border-lp-border text-sm text-lp-text2">
            {formData.language === "english" &&
              'Preview: "Thank you for visiting us!"'}
            {formData.language === "hinglish" &&
              'Preview: "Shukriya for visiting! Zaroor aana again 🙏"'}
            {formData.language === "hindi" &&
              'Preview: "आपका स्वागत है! दोबारा ज़रूर आएं 🙏"'}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-lp-text2 mb-2">
            Current offers or promotions (optional)
          </label>
          <textarea
            value={formData.current_offers}
            onChange={(e) => update({ current_offers: e.target.value })}
            rows={2}
            placeholder="10% off on weekdays before 10am. Free delivery above ₹500 on orders."
            className="w-full bg-lp-surface2 border border-lp-border2 rounded-lg px-4 py-3 text-lp-text focus:outline-none focus:border-lp-accent transition-colors resize-none"
          />
          <p className="text-xs text-lp-text2 mt-1">
            AI will naturally mention these in relevant posts
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-lp-text2 mb-2">
            Anything to NEVER mention (optional)
          </label>
          <textarea
            value={formData.never_mention}
            onChange={(e) => update({ never_mention: e.target.value })}
            rows={2}
            placeholder="Competitor names. Our pricing. The word cheap."
            className="w-full bg-lp-surface2 border border-lp-border2 rounded-lg px-4 py-3 text-lp-text focus:outline-none focus:border-lp-accent transition-colors resize-none"
          />
          <p className="text-xs text-lp-text2 mt-1">
            Hard rules — AI will never include these
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-lp-text2 mb-2">
            Any sensitive topics to avoid? (optional)
          </label>
          <textarea
            value={formData.sensitive_topics}
            onChange={(e) => update({ sensitive_topics: e.target.value })}
            rows={1}
            placeholder="Religious topics. Political content."
            className="w-full bg-lp-surface2 border border-lp-border2 rounded-lg px-4 py-3 text-lp-text focus:outline-none focus:border-lp-accent transition-colors resize-none"
          />
          <p className="text-xs text-lp-text2 mt-1">
            Optional but recommended for safety
          </p>
        </div>
      </div>
      
      <p className="text-xs text-center text-lp-text2 mt-4 pt-4 border-t border-lp-border">
        You can always edit these from Profile Settings anytime
      </p>
    </div>
  );
}
