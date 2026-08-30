"use client";

import { useEffect, useState } from "react";
import { Sparkles, RefreshCw, ArrowRight } from "lucide-react";
import Link from "next/link";

type ActionItem = {
  icon_color: "red" | "yellow" | "green" | "blue";
  text: string;
  button_text: string;
  action_type: "review" | "post" | "queue";
};

const colorMap = {
  red: "text-lp-red bg-lp-red/10 border-lp-red/20",
  yellow: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  green: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  blue: "text-lp-accent3 bg-lp-accent3/10 border-lp-accent3/20",
};

const dotColorMap = {
  red: "bg-lp-red",
  yellow: "bg-amber-500",
  green: "bg-emerald-500",
  blue: "bg-lp-accent3",
};

export function AiActionsDashboard({ businessId }: { businessId: string }) {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActions = async (force = false) => {
    if (force) setRefreshing(true);
    try {
      const res = await fetch(`/api/ai/dashboard-actions?business_id=${businessId}${force ? "&force=true" : ""}`);
      const json = await res.json();
      if (res.ok && Array.isArray(json)) {
        setActions(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (businessId) fetchActions();
  }, [businessId]);

  if (loading) {
    return (
      <div className="mt-8 rounded-xl border border-lp-border bg-lp-surface p-6 animate-pulse">
        <div className="h-6 w-40 bg-lp-surface3 rounded mb-5" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 rounded-lg bg-lp-surface2" />
          ))}
        </div>
      </div>
    );
  }

  if (actions.length === 0) return null;

  return (
    <div className="mt-8 rounded-xl border border-lp-accent/20 bg-gradient-to-br from-lp-surface to-lp-surface2 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-lp-accent" />
          <h2 className="font-heading text-xl font-bold text-lp-text">Today's Actions</h2>
        </div>
        <button
          onClick={() => fetchActions(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs font-bold text-lp-text3 hover:text-lp-text transition disabled:opacity-50"
        >
          <RefreshCw className={`size-3 ${refreshing ? "animate-spin text-lp-accent" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {actions.map((action, i) => {
          let href = "/dashboard";
          if (action.action_type === "review") href = "/dashboard/reviews";
          if (action.action_type === "post") href = "/dashboard"; // stay on dashboard for post modal
          if (action.action_type === "queue") href = "/dashboard/queue";

          return (
            <div key={i} className={`flex items-center justify-between gap-4 rounded-lg border ${colorMap[action.icon_color]} p-4 transition-colors hover:brightness-110`}>
              <div className="flex items-center gap-3">
                <div className={`size-2.5 rounded-full ${dotColorMap[action.icon_color]} shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.3)]`} />
                <p className="text-sm font-medium text-lp-text">{action.text}</p>
              </div>
              <Link
                href={href}
                className="shrink-0 flex items-center gap-1.5 rounded-md bg-lp-bg/50 px-3 py-1.5 text-xs font-bold text-lp-text hover:bg-lp-bg transition-colors"
              >
                {action.button_text}
                <ArrowRight className="size-3" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
