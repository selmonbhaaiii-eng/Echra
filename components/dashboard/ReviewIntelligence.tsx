"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";

type Intelligence = {
  customers_love?: string;
  customers_dislike?: string;
  insight?: string;
};

export function ReviewIntelligence({ businessId }: { businessId: string }) {
  const [data, setData] = useState<Intelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIntelligence = async (force = false) => {
    if (force) setRefreshing(true);
    try {
      const res = await fetch(`/api/ai/review-intelligence?business_id=${businessId}${force ? "&force=true" : ""}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (businessId) fetchIntelligence();
  }, [businessId]);

  if (loading) {
    return (
      <div className="mt-8 rounded-xl border border-lp-border bg-lp-surface p-5 animate-pulse">
        <div className="h-5 w-32 bg-lp-surface3 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-3/4 bg-lp-surface2 rounded" />
          <div className="h-4 w-1/2 bg-lp-surface2 rounded" />
        </div>
      </div>
    );
  }

  if (!data || !data.insight) return null;

  return (
    <div className="mt-8 rounded-xl border border-[rgba(255,255,255,0.05)] bg-gradient-to-br from-lp-surface to-lp-surface2 p-4 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-lp-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <div className="relative flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-lp-accent" />
          <h2 className="font-heading text-lg font-bold text-lp-text">Customer Voice</h2>
        </div>
        <button
          onClick={() => fetchIntelligence(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs font-bold text-lp-text3 hover:text-lp-text transition disabled:opacity-50"
        >
          <RefreshCw className={`size-3 ${refreshing ? "animate-spin text-lp-accent" : ""}`} />
          Refresh insights
        </button>
      </div>

      <div className="relative grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr]">
        <div className="flex items-start gap-3 rounded-lg border border-lp-border bg-lp-surface p-4">
          <div className="mt-0.5 rounded-full bg-emerald-500/10 p-1.5 text-emerald-500">
            <ThumbsUp className="size-4" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">Customers Love</p>
            <p className="mt-1 text-sm text-lp-text2">{data.customers_love}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-lp-border bg-lp-surface p-4">
          <div className="mt-0.5 rounded-full bg-lp-red/10 p-1.5 text-lp-red">
            <ThumbsDown className="size-4" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-lp-red">Customers Dislike</p>
            <p className="mt-1 text-sm text-lp-text2">{data.customers_dislike}</p>
          </div>
        </div>

        <div className="flex items-center rounded-lg border border-lp-accent/20 bg-lp-accent/5 p-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-lp-accent">AI Insight</p>
            <p className="mt-1 text-sm font-medium text-lp-text">{data.insight}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
