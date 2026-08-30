"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function SyncGBPProfileButton({ businessId }: { businessId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/businesses/sync-gbp-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to sync");
      
      alert(`Profile synced! Updated name: ${data.name}`);
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Failed to sync profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={isLoading}
      title="Sync GBP Profile Details"
      className="ml-2 inline-flex items-center justify-center rounded-full p-1 text-lp-text2 hover:bg-lp-surface2 hover:text-lp-text transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin text-lp-accent" : ""}`} />
    </button>
  );
}
