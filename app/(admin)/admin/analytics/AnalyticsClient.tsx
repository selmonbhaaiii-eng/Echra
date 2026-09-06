"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  DollarSign,
  Loader2,
  Mail,
  MessageSquareText,
  RadioTower,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import { sendReminder } from "./actions";

const iconMap: Record<string, any> = {
  Sparkles,
  MessageSquareText,
  RadioTower,
  DollarSign,
  Zap,
  ai_post_generated: Sparkles,
  ai_reply_generated: MessageSquareText,
  gbp_post_published: RadioTower,
  gbp_reply_published: RadioTower,
  review_synced: MessageSquareText,
  ai_phrases_extracted: Sparkles,
  ai_image_suggested: Sparkles,
};

interface StatItem {
  label: string;
  value: string | number;
  icon: any;
  accent: string;
}

interface ClientUsage {
  id: string;
  name: string;
  aiPosts: number;
  aiReplies: number;
  gbpPublished: number;
  reviewsSynced: number;
  estCostInr: number;
  lastActiveFormatted: string;
  status: "Active" | "Idle" | "At Risk" | "Not Started";
}

interface CostBreakdown {
  totalInr: number;
  totalUsd: number;
  totalRevenueInr: number;
  costPercent: number;
  projectedCostInr: number;
}

interface ActivityLog {
  id: string;
  timeAgo: string;
  businessName: string;
  actionText: string;
  icon: any;
}

interface ChurnAlert {
  id: string;
  businessId: string;
  businessName: string;
  alertType: "never_connected_gbp" | "idle_client" | "posts_waiting_approval";
  message: string;
}

interface AnalyticsClientProps {
  stats: StatItem[];
  usages: ClientUsage[];
  costBreakdown: CostBreakdown;
  activities: ActivityLog[];
  alerts: ChurnAlert[];
}

export function AnalyticsClient({
  stats,
  usages,
  costBreakdown,
  activities,
  alerts,
}: AnalyticsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sendingAlertId, setSendingAlertId] = useState<string | null>(null);
  const [sentAlertIds, setSentAlertIds] = useState<string[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
      setLastRefreshed(new Date());
    });
  };

  const handleSendReminder = async (alertItem: ChurnAlert) => {
    const alertKey = `${alertItem.businessId}-${alertItem.alertType}`;
    setSendingAlertId(alertKey);

    try {
      const res = await sendReminder(alertItem.businessId, alertItem.alertType);
      if (res.ok) {
        setSentAlertIds((prev) => [...prev, alertKey]);
      } else {
        alert(res.error || "Failed to send reminder");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSendingAlertId(null);
    }
  };

  const statusColors = {
    Active: "bg-green-500/10 text-green-500 border-green-500/20",
    Idle: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    "At Risk": "bg-red-500/10 text-red-500 border-red-500/20",
    "Not Started": "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };

  const alertTypeLabels = {
    never_connected_gbp: "GBP Connection",
    idle_client: "Inactivity",
    posts_waiting_approval: "Approval Pending",
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-lp-accent">Admin</p>
          <h1 className="mt-1 sm:mt-2 font-heading text-2xl sm:text-4xl font-extrabold text-lp-text">Analytics</h1>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-lp-text2">
            Monitor product usage, AI costs, customer retention risk, and real-time operations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={handleRefresh}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-lp-accent px-3.5 py-1.5 text-xs sm:text-sm font-bold text-lp-bg transition hover:bg-lp-accent/90 disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 sm:size-4 ${isPending ? "animate-spin" : ""}`} />
            Refresh Data
          </button>
          <div className="flex items-center gap-2 text-xs text-lp-text3 bg-lp-surface border border-lp-border px-2.5 sm:px-3 py-1.5 rounded-lg">
            <span>Last updated: {lastRefreshed.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Section 1 — Overview Stats Row */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat, idx) => {
          const Icon = iconMap[stat.icon] || Zap;
          return (
            <div key={idx} className="overflow-hidden rounded-xl border border-lp-border bg-lp-surface">
              <div className={`h-0.5 ${stat.accent}`} />
              <div className="p-3.5 sm:p-5">
                <div className="mb-2 sm:mb-4 flex size-8 sm:size-9 items-center justify-center rounded-lg bg-lp-surface2 text-lp-text2">
                  <Icon className="size-3.5 sm:size-4" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-lp-text2 truncate">{stat.label}</p>
                <p className="mt-1.5 sm:mt-3 font-heading text-xl sm:text-3xl font-bold text-lp-text truncate">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Main Grid: Section 2 & Section 5 */}
      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        {/* Section 2 — Customer Usage Table */}
        <div className="rounded-xl border border-lp-border bg-lp-surface p-4 sm:p-6 overflow-hidden flex flex-col">
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-lp-text mb-5">Customer Usage — {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
          <div className="flex-1 overflow-x-auto hide-scrollbar">
            <table className="w-full min-w-[640px] border-collapse text-left whitespace-nowrap">
              <thead>
                <tr className="border-b border-lp-border text-xs font-bold uppercase tracking-wider text-lp-text3">
                  <th className="pb-3 pr-4">Business</th>
                  <th className="pb-3 px-4 text-center">AI Posts</th>
                  <th className="pb-3 px-4 text-center">AI Replies</th>
                  <th className="pb-3 px-4 text-center">GBP Published</th>
                  <th className="pb-3 px-4 text-center">Reviews</th>
                  <th className="pb-3 px-4 text-right">Est. Cost</th>
                  <th className="pb-3 px-4 text-right">Last Active</th>
                  <th className="pb-3 pl-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lp-border/50 text-sm">
                {usages.length > 0 ? (
                  usages.map((u) => (
                    <tr key={u.id} className="hover:bg-lp-surface2/30 transition-colors">
                      <td className="py-4 pr-4 font-bold text-lp-text truncate max-w-[150px]">{u.name}</td>
                      <td className="py-4 px-4 text-center text-lp-text2">{u.aiPosts}</td>
                      <td className="py-4 px-4 text-center text-lp-text2">{u.aiReplies}</td>
                      <td className="py-4 px-4 text-center text-lp-text2">{u.gbpPublished}</td>
                      <td className="py-4 px-4 text-center text-lp-text2">{u.reviewsSynced}</td>
                      <td className="py-4 px-4 text-right font-semibold text-lp-text">₹{u.estCostInr.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                      <td className="py-4 px-4 text-right text-lp-text2">{u.lastActiveFormatted}</td>
                      <td className="py-4 pl-4 text-right">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${statusColors[u.status]}`}>
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-lp-text3">No clients found in the system.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5 — Churn Risk Alerts */}
        <div className="rounded-xl border border-lp-border bg-lp-surface p-4 sm:p-6 flex flex-col">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-lp-text flex items-center gap-2">
              <AlertTriangle className="size-5 text-orange-500" />
              Needs Attention
            </h2>
            <span className="rounded-full bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 text-xs font-bold text-orange-500">
              {alerts.length} Alerts
            </span>
          </div>

          <div className="flex-1 space-y-4">
            {alerts.length > 0 ? (
              alerts.map((alert) => {
                const alertKey = `${alert.businessId}-${alert.alertType}`;
                const isSending = sendingAlertId === alertKey;
                const isSent = sentAlertIds.includes(alertKey);

                return (
                  <div key={alert.id} className="rounded-xl border border-lp-border2 bg-lp-surface2 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wide text-orange-500">
                        {alertTypeLabels[alert.alertType]}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-lp-text">{alert.businessName}</p>
                    <p className="text-xs leading-relaxed text-lp-text2">{alert.message}</p>
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => handleSendReminder(alert)}
                        disabled={isSending || isSent}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                          isSent
                            ? "bg-green-500/10 text-green-500 border border-green-500/20 cursor-default"
                            : "bg-lp-accent text-lp-bg hover:brightness-95 disabled:opacity-50"
                        }`}
                      >
                        {isSending ? (
                          <>
                            <Loader2 className="size-3 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : isSent ? (
                          <>
                            <CheckCircle2 className="size-3" />
                            <span>Sent!</span>
                          </>
                        ) : (
                          <>
                            <Mail className="size-3" />
                            <span>Send Reminder</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-lp-border2 bg-lp-bg/40 p-8 text-center">
                <CheckCircle2 className="size-8 text-green-500 mb-2" />
                <p className="font-heading text-lg font-bold text-lp-text">All clean!</p>
                <p className="text-xs text-lp-text2">No client flags or warnings at this time.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Grid: Section 3 & Section 4 */}
      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        {/* Section 3 — AI Cost Breakdown */}
        <div className="rounded-xl border border-lp-border bg-lp-surface p-4 sm:p-6 space-y-6 flex flex-col justify-between">
          <div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-lp-text mb-5">AI Cost Breakdown</h2>
            <div className="space-y-4">
              {usages.map((u, idx) => {
                const totalCost = costBreakdown.totalInr;
                const percent = totalCost > 0 ? (u.estCostInr / totalCost) * 100 : 0;
                const barColors = ["bg-lp-accent", "bg-lp-accent2", "bg-lp-accent3", "bg-lp-red"];
                const color = barColors[idx % barColors.length];

                return (
                  <div key={u.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-lp-text">{u.name}</span>
                      <span className="text-lp-text2">
                        ₹{u.estCostInr.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-lp-surface2 overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(percent, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-lp-border pt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-lp-text2">Total AI cost this month:</span>
              <span className="font-bold text-lp-text">
                ₹{costBreakdown.totalInr.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                <span className="text-xs text-lp-text3 font-normal ml-1">(${costBreakdown.totalUsd.toFixed(2)})</span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-lp-text2">Total revenue this month:</span>
              <span className="font-bold text-lp-text">
                ₹{costBreakdown.totalRevenueInr.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-lp-text2">AI cost as % of revenue:</span>
              <span className="font-bold text-lp-accent">
                {costBreakdown.costPercent.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between border-t border-dashed border-lp-border/50 pt-3">
              <span className="text-lp-text2">Estimated cost at 100 clients:</span>
              <span className="font-bold text-lp-text">
                ₹{costBreakdown.projectedCostInr.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/month
                <span className="text-xs text-lp-text3 font-normal ml-1">(${(costBreakdown.projectedCostInr / 83.5).toFixed(0)})</span>
              </span>
            </div>
          </div>
        </div>

        {/* Section 4 — Activity Feed */}
        <div className="rounded-xl border border-lp-border bg-lp-surface p-4 sm:p-6 flex flex-col">
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-lp-text mb-5">Activity Feed</h2>
          <div className="flex-1 space-y-4 max-h-[360px] overflow-y-auto pr-1">
            {activities.length > 0 ? (
              activities.map((act) => {
                const Icon = iconMap[act.icon] || Zap;
                return (
                  <div key={act.id} className="flex items-start gap-4">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-lp-surface2 text-lp-text2">
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-lp-text truncate">{act.businessName}</p>
                      <p className="text-xs text-lp-text2 mt-0.5">{act.actionText}</p>
                    </div>
                    <span className="text-xs text-lp-text3 font-medium whitespace-nowrap shrink-0">
                      {act.timeAgo}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-lp-border2 bg-lp-bg/40 p-8 text-center">
                <RadioTower className="size-8 text-lp-text3 mb-2 animate-pulse" />
                <p className="font-heading text-lg font-bold text-lp-text">No activity yet</p>
                <p className="text-xs text-lp-text2">Real-time usage actions will show up here as they occur.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
