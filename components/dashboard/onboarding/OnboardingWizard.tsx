"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepOne } from "./StepOne";
import { StepTwo } from "./StepTwo";
import { StepThree } from "./StepThree";
import { StepFour } from "./StepFour";
import { calculateContextCompletion } from "@/lib/ai/context-builder";

export type FormData = {
  owner_name: string;
  owner_role: string;
  description: string;
  top_products: string[];
  usp: string;
  customer_type: string[];
  local_area: string;
  tone: string;
  language: string;
  current_offers: string;
  never_mention: string;
  sensitive_topics: string;
};

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    owner_name: "",
    owner_role: "owner",
    description: "",
    top_products: ["", "", ""],
    usp: "",
    customer_type: [],
    local_area: "",
    tone: "warm_friendly",
    language: "hinglish",
    current_offers: "",
    never_mention: "",
    sensitive_topics: "",
  });

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 4));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));
  const handleSkip = () => {
    if (step < 4) handleNext();
    else handleSubmit();
  };

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/businesses/context", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
          <h2 className="text-sm font-medium text-lp-text2">
            Step {step} of 4
          </h2>
          <span className="text-xs text-lp-text2">
            {Math.round((step / 4) * 100)}%
          </span>
        </div>
        <div className="flex gap-2 h-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 rounded-full ${
                s <= step ? "bg-lp-accent" : "bg-lp-surface3"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="bg-lp-surface border border-lp-border rounded-xl p-6 shadow-sm">
        {step === 1 && <StepOne formData={formData} update={updateFormData} />}
        {step === 2 && <StepTwo formData={formData} update={updateFormData} />}
        {step === 3 && <StepThree formData={formData} update={updateFormData} />}
        {step === 4 && <StepFour formData={formData} update={updateFormData} />}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div>
          {step > 1 && (
            <button
              onClick={handleBack}
              className="text-lp-text2 hover:text-lp-text text-sm font-medium transition-colors px-4 py-2"
            >
              ← Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSkip}
            className="text-lp-text2 hover:text-lp-text text-sm transition-colors"
          >
            Skip for now
          </button>
          {step < 4 ? (
            <button
              onClick={handleNext}
              className="bg-lp-text text-lp-bg px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-lp-accent text-lp-bg px-6 py-2 rounded-lg font-medium hover:brightness-110 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Complete Setup →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
