"use client";

import { useState, useCallback, useEffect } from "react";
import { FormData } from "./onboarding/OnboardingWizard";
import { StepOne } from "./onboarding/StepOne";
import { StepTwo } from "./onboarding/StepTwo";
import { StepThree } from "./onboarding/StepThree";
import { StepFour } from "./onboarding/StepFour";

export function ProfileSettingsForm({
  initialData,
  initialPercent,
}: {
  initialData: any;
  initialPercent: number;
}) {
  const [formData, setFormData] = useState<FormData>({
    owner_name: initialData.owner_name || "",
    owner_role: initialData.owner_role || "owner",
    description: initialData.description || "",
    top_products: initialData.top_products || ["", "", ""],
    usp: initialData.usp || "",
    customer_type: initialData.customer_type || [],
    local_area: initialData.local_area || "",
    tone: initialData.tone || "warm_friendly",
    language: initialData.language || "hinglish",
    current_offers: initialData.current_offers || "",
    never_mention: initialData.never_mention || "",
    sensitive_topics: initialData.sensitive_topics || "",
  });

  const [percent, setPercent] = useState(initialPercent);
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved">("idle");

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const saveChanges = useCallback(async (dataToSave: FormData) => {
    setSavingStatus("saving");
    try {
      const response = await fetch("/api/businesses/context", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });
      if (response.ok) {
        const result = await response.json();
        setPercent(result.completion || percent);
        setSavingStatus("saved");
        setTimeout(() => setSavingStatus("idle"), 2000);
      } else {
        setSavingStatus("idle");
      }
    } catch (error) {
      console.error("Save error", error);
      setSavingStatus("idle");
    }
  }, [percent]);



  return (
    <div className="space-y-8 pb-12">
      {/* Completion Header */}
      <div className="bg-lp-surface border border-lp-border rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative size-12 sm:size-14 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-surface3"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 24}
                strokeDashoffset={2 * Math.PI * 24 * (1 - percent / 100)}
                className={percent >= 100 ? "text-lp-accent text-emerald-500" : "text-lp-accent3 text-yellow-500"}
              />
            </svg>
            <span className="absolute text-xs sm:text-sm font-bold text-lp-text">{percent}%</span>
          </div>
          <div>
            <h3 className="font-semibold text-lp-text text-sm sm:text-base">Your profile is {percent}% complete</h3>
            <p className="text-xs sm:text-sm text-lp-text2">More complete = better AI posts</p>
          </div>
        </div>
        <div className="text-xs sm:text-sm self-end sm:self-center">
          {savingStatus === "saved" && <span className="text-lp-accent font-medium">Saved ✓</span>}
          {savingStatus === "idle" && <span className="text-lp-text2">Unsaved changes</span>}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-lp-surface border border-lp-border rounded-xl p-6">
          <StepOne formData={formData} update={updateFormData} />
        </div>
        <div className="bg-lp-surface border border-lp-border rounded-xl p-6">
          <StepTwo formData={formData} update={updateFormData} />
        </div>
        <div className="bg-lp-surface border border-lp-border rounded-xl p-6">
          <StepThree formData={formData} update={updateFormData} />
        </div>
        <div className="bg-lp-surface border border-lp-border rounded-xl p-6">
          <StepFour formData={formData} update={updateFormData} />
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
        <button
          onClick={() => saveChanges(formData)}
          disabled={savingStatus === "saving"}
          className="bg-lp-accent text-lp-bg px-8 py-3 rounded-xl font-bold hover:brightness-110 transition-colors disabled:opacity-50"
        >
          {savingStatus === "saving" ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
