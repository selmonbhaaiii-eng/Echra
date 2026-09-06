"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { updateAutomationRule } from "./actions";

type Rule = {
  rule_type: string;
  is_active: boolean | null;
  config: any;
  last_triggered_at: string | null;
};

export function AutomationSettingsClient({
  businessId,
  initialRules,
}: {
  businessId: string;
  initialRules: Rule[];
}) {
  const getRule = (type: string, defaultConfig: any) => {
    const existing = initialRules.find((r) => r.rule_type === type);
    if (existing) return existing;
    return {
      rule_type: type,
      is_active: true,
      config: defaultConfig,
      last_triggered_at: null,
    };
  };

  const [reviewRule, setReviewRule] = useState<Rule>(
    getRule("review_to_post", { min_rating: 4 })
  );
  const [seasonalRule, setSeasonalRule] = useState<Rule>(
    getRule("seasonal_calendar", { lead_days: 5 })
  );
  const [replyRule, setReplyRule] = useState<Rule>(
    getRule("auto_reply", { default_tone: "warm_friendly" })
  );

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdate = async (
    rule: Rule,
    setRule: React.Dispatch<React.SetStateAction<Rule>>,
    updates: Partial<Rule>
  ) => {
    const newRule = { ...rule, ...updates };
    setRule(newRule); // Optimistic update

    const result = await updateAutomationRule(
      businessId,
      newRule.rule_type,
      newRule.is_active || false,
      newRule.config
    );

    if (result.success) {
      showToast("Saved ✓", "success");
    } else {
      showToast("Failed to save. Try again.", "error");
      setRule(rule); // Revert
    }
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return "Never triggered yet";
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return "Less than an hour ago";
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  return (
    <div className="max-w-3xl space-y-4 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-2 font-medium shadow-lg transition-all ${
            toast.type === "success" ? "bg-lp-accent text-lp-bg" : "bg-red-500 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* SECTION 1 - POST GENERATION */}
      <div className="rounded-[12px] border border-[rgba(255,255,255,0.07)] bg-lp-surface p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h3 className="font-heading text-base sm:text-lg font-bold text-lp-text">
                Auto-generate posts from reviews
              </h3>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                Core Feature
              </span>
            </div>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-lp-text2 max-w-xl">
              When a customer leaves a 4+ star review, we automatically write a post and add it to
              your approval queue. You approve before anything goes live.
            </p>
            <p className="mt-3 text-xs text-lp-text3 font-medium">
              Last triggered: {formatTimeAgo(reviewRule.last_triggered_at)}
            </p>
          </div>
          <button
            onClick={() => handleUpdate(reviewRule, setReviewRule, { is_active: !reviewRule.is_active })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-[rgba(255,255,255,0.1)] transition-colors duration-200 ease-in-out ${
              reviewRule.is_active ? "bg-lp-accent" : "bg-lp-surface3"
            }`}
          >
            <span
              className={`inline-block size-5 transform rounded-full bg-lp-bg transition duration-200 ease-in-out ${
                reviewRule.is_active ? "translate-x-5" : "translate-x-0.5"
              } mt-px`}
            />
          </button>
        </div>

        <div
          className={`grid transition-all duration-300 ease-in-out ${
            reviewRule.is_active ? "grid-rows-[1fr] opacity-100 mt-6" : "grid-rows-[0fr] opacity-0 mt-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="rounded-lg border border-[rgba(255,255,255,0.05)] bg-lp-surface2 p-4">
              <label className="mb-3 block text-sm font-medium text-lp-text2">
                Minimum star rating to trigger
              </label>
              <select
                value={reviewRule.config?.min_rating || 4}
                onChange={(e) =>
                  handleUpdate(reviewRule, setReviewRule, {
                    config: { ...reviewRule.config, min_rating: Number(e.target.value) },
                  })
                }
                className="w-full max-w-[200px] rounded-md border border-[rgba(255,255,255,0.1)] bg-lp-surface p-2 text-sm text-lp-text focus:border-lp-accent focus:outline-none"
              >
                <option value={3}>3 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={5}>5 Stars only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2 - SEASONAL POSTS */}
      <div className="rounded-[12px] border border-[rgba(255,255,255,0.07)] bg-lp-surface p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h3 className="font-heading text-base sm:text-lg font-bold text-lp-text">
                Auto-draft seasonal posts
              </h3>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-500">
                Recommended
              </span>
            </div>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-lp-text2 max-w-xl">
              We automatically draft posts for Diwali, Eid, Christmas, Independence Day and other
              occasions 5 days before they happen. You approve before anything goes live on Google.
            </p>
          </div>
          <button
            onClick={() => handleUpdate(seasonalRule, setSeasonalRule, { is_active: !seasonalRule.is_active })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-[rgba(255,255,255,0.1)] transition-colors duration-200 ease-in-out ${
              seasonalRule.is_active ? "bg-lp-accent" : "bg-lp-surface3"
            }`}
          >
            <span
              className={`inline-block size-5 transform rounded-full bg-lp-bg transition duration-200 ease-in-out ${
                seasonalRule.is_active ? "translate-x-5" : "translate-x-0.5"
              } mt-px`}
            />
          </button>
        </div>

        <div
          className={`grid transition-all duration-300 ease-in-out ${
            seasonalRule.is_active ? "grid-rows-[1fr] opacity-100 mt-6" : "grid-rows-[0fr] opacity-0 mt-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="rounded-lg border border-[rgba(255,255,255,0.05)] bg-lp-surface2 p-4">
              <label className="mb-3 block text-sm font-medium text-lp-text2">
                How many days before the occasion?
              </label>
              <div className="flex gap-2 flex-wrap">
                {[3, 5, 7].map((days) => (
                  <button
                    key={days}
                    onClick={() =>
                      handleUpdate(seasonalRule, setSeasonalRule, {
                        config: { ...seasonalRule.config, lead_days: days },
                      })
                    }
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors border ${
                      seasonalRule.config?.lead_days === days
                        ? "bg-lp-accent/10 border-lp-accent/30 text-lp-accent"
                        : "bg-lp-surface border-[rgba(255,255,255,0.05)] text-lp-text2 hover:text-lp-text"
                    }`}
                  >
                    {days} days
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3 - REVIEW REPLIES */}
      <div className="rounded-[12px] border border-[rgba(255,255,255,0.07)] bg-lp-surface p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h3 className="font-heading text-base sm:text-lg font-bold text-lp-text">
                Auto-draft replies for new reviews
              </h3>
              <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-500">
                Saves time
              </span>
            </div>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-lp-text2 max-w-xl">
              When any new review comes in, we automatically draft a reply and add it to your review
              inbox. You approve and copy before it goes to Google.
            </p>
          </div>
          <button
            onClick={() => handleUpdate(replyRule, setReplyRule, { is_active: !replyRule.is_active })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-[rgba(255,255,255,0.1)] transition-colors duration-200 ease-in-out ${
              replyRule.is_active ? "bg-lp-accent" : "bg-lp-surface3"
            }`}
          >
            <span
              className={`inline-block size-5 transform rounded-full bg-lp-bg transition duration-200 ease-in-out ${
                replyRule.is_active ? "translate-x-5" : "translate-x-0.5"
              } mt-px`}
            />
          </button>
        </div>

        <div
          className={`grid transition-all duration-300 ease-in-out ${
            replyRule.is_active ? "grid-rows-[1fr] opacity-100 mt-6" : "grid-rows-[0fr] opacity-0 mt-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="rounded-lg border border-[rgba(255,255,255,0.05)] bg-lp-surface2 p-4">
              <label className="mb-3 block text-sm font-medium text-lp-text2">
                Default reply tone
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: "warm_friendly", label: "Warm & Friendly" },
                  { id: "professional", label: "Professional" },
                  { id: "apologetic_caring", label: "Apologetic & Caring" },
                  { id: "funny_witty", label: "Funny & Witty" },
                  { id: "hinglish", label: "Hinglish" },
                ].map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() =>
                      handleUpdate(replyRule, setReplyRule, {
                        config: { ...replyRule.config, default_tone: tone.id },
                      })
                    }
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors border ${
                      replyRule.config?.default_tone === tone.id
                        ? "bg-lp-accent/10 border-lp-accent/30 text-lp-accent"
                        : "bg-lp-surface border-[rgba(255,255,255,0.05)] text-lp-text2 hover:text-lp-text"
                    }`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4 - AUTOPILOT (LOCKED) */}
      <div className="rounded-[12px] border border-[rgba(255,255,255,0.07)] bg-lp-surface p-4 sm:p-6 opacity-50 relative overflow-hidden">
        <div className="absolute top-6 right-6">
          <Lock className="size-5 text-lp-text3" />
        </div>
        <div className="flex items-start justify-between gap-3 pr-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h3 className="font-heading text-base sm:text-lg font-bold text-lp-text">
                Hands-Free Autopilot
              </h3>
              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-500">
                Admin only
              </span>
            </div>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-lp-text2 max-w-xl">
              Posts publish directly to Google without requiring your approval first. Contact us to
              enable this for your account.
            </p>
            <p className="mt-3 text-xs text-lp-text3 font-medium">
              Available on Agency plan. Contact support to activate.
            </p>
          </div>
          <button
            disabled
            className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full border border-[rgba(255,255,255,0.1)] bg-lp-surface3 opacity-50"
          >
            <span className="inline-block size-5 transform rounded-full bg-lp-bg translate-x-0.5 mt-px" />
          </button>
        </div>
      </div>

      {/* IMPORTANT NOTES SECTION */}
      <div className="rounded-lg bg-lp-surface2/50 p-4 border border-[rgba(255,255,255,0.05)] mt-8">
        <p className="text-xs leading-relaxed text-lp-text3 text-center">
          Changes apply to all new content from tomorrow. Posts already in your queue are not affected.<br />
          All auto-generated content still requires your approval before publishing to Google.
        </p>
      </div>
    </div>
  );
}
