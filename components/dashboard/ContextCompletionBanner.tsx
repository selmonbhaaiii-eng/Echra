"use client";

import { useState } from "react";
import Link from "next/link";

export function ContextCompletionBanner({ percent }: { percent: number }) {
  const [dismissed, setDismissed] = useState(false);

  if (percent >= 100 || dismissed) {
    return null;
  }

  return (
    <div
      className="flex items-center justify-between p-4 mb-6 rounded-xl relative border border-lp-border bg-lp-surface overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-lp-accent3" />
      <div className="flex gap-4 ml-2">
        <div className="text-3xl">📝</div>
        <div>
          <h3 className="text-lp-text font-semibold mb-1">
            Complete your business profile
          </h3>
          <p className="text-lp-text2 text-sm">
            Your AI posts will be {100 - percent}% more specific and personal once your profile is complete.
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-lp-surface2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-lp-accent3 rounded-full" 
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-sm font-medium text-lp-accent3">{percent}%</span>
        </div>
        
        <Link 
          href="/dashboard/onboarding"
          className="text-sm font-medium text-lp-bg bg-lp-accent3 px-4 py-2 rounded-lg hover:brightness-110 transition-colors"
        >
          Complete Profile →
        </Link>
        
        <button 
          onClick={() => setDismissed(true)}
          className="text-lp-text2 hover:text-lp-text absolute top-2 right-2 p-1"
          title="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
