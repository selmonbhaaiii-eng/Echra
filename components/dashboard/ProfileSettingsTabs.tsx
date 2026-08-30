"use client";

import { useState } from "react";
import { ProfileSettingsForm } from "./ProfileSettingsForm";
import { MediaLibrary } from "./MediaLibrary";
import { User, Image } from "lucide-react";

export function ProfileSettingsTabs({
  businessId,
  initialData,
  initialPercent,
}: {
  businessId: string;
  initialData: any;
  initialPercent: number;
}) {
  const [activeTab, setActiveTab] = useState<"profile" | "media">("profile");

  return (
    <div className="space-y-6">
      {/* Tabs Menu */}
      <div className="flex border-b border-lp-border gap-2 pb-px">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
            activeTab === "profile"
              ? "border-lp-accent text-lp-accent"
              : "border-transparent text-lp-text2 hover:text-lp-text"
          }`}
        >
          <User className="size-4" />
          Profile Context
        </button>
        <button
          onClick={() => setActiveTab("media")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition ${
            activeTab === "media"
              ? "border-lp-accent text-lp-accent"
              : "border-transparent text-lp-text2 hover:text-lp-text"
          }`}
        >
          <Image className="size-4" />
          Media Library
        </button>
      </div>

      {/* Tab content wrapper */}
      <div>
        {activeTab === "profile" ? (
          <ProfileSettingsForm
            initialData={initialData}
            initialPercent={initialPercent}
          />
        ) : (
          <MediaLibrary businessId={businessId} />
        )}
      </div>
    </div>
  );
}
