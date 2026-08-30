"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, ExternalLink, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { BusinessPlan, PlanStatus } from "@/types/database";
import { deleteClient } from "@/app/(admin)/admin/clients/actions";

export type AdminBusiness = {
  id: string;
  name: string;
  category: string | null;
  location: string | null;
  gbp_location_id: string | null;
  gbp_connected: boolean | null;
  last_review_sync: string | null;
  total_reviews: number | null;
  plan: BusinessPlan | null;
  plan_status: PlanStatus | null;
  health_score: number | null;
  posts_this_month: number | null;
  monthly_post_limit: number | null;
  owner?: {
    email: string | null;
    full_name: string | null;
  } | null;
};

const planMeta: Record<string, { label: string; price: number; className: string }> = {
  starter: {
    label: "Starter",
    price: 799,
    className: "bg-lp-accent2/10 text-lp-accent2 border-lp-accent2/20",
  },
  growth: {
    label: "Growth",
    price: 1999,
    className: "bg-lp-accent3/10 text-lp-accent3 border-lp-accent3/20",
  },
  agency: {
    label: "Agency",
    price: 4999,
    className: "bg-lp-accent/10 text-lp-accent border-lp-accent/20",
  },
  trial: {
    label: "Trial",
    price: 0,
    className: "bg-lp-surface2 text-lp-text2 border-lp-border",
  },
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function statusLabel(status: PlanStatus | null, healthScore: number | null) {
  if (status === "active" && (healthScore ?? 0) >= 65) {
    return "Active";
  }

  if (status === "trial") {
    return "Trial";
  }

  return "Needs attention";
}

function relativeTime(value: string | null) {
  if (!value) {
    return "Never";
  }

  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diff / 60_000));

  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;

  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

export function ClientsTable({ businesses }: { businesses: AdminBusiness[] }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      businesses.map((business) => {
        const meta = planMeta[business.plan ?? "trial"] ?? planMeta.trial;
        const health = business.health_score ?? 0;
        const status = statusLabel(business.plan_status, health);

        return {
          ...business,
          meta,
          health,
          status,
          gbpCount: business.gbp_location_id ? 1 : 1,
          posts: business.posts_this_month ?? 0,
          limit: business.monthly_post_limit ?? 30,
        };
      }),
    [businesses],
  );

  if (!rows.length) {
    return (
      <div className="rounded-xl border border-lp-border bg-lp-surface p-10 text-center">
        <h2 className="font-heading text-2xl font-bold text-lp-text">No clients yet</h2>
        <p className="mt-2 text-sm text-lp-text2">Invite your first business to start the engine.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-lp-border bg-lp-surface overflow-x-auto hide-scrollbar">
      <table className="w-full min-w-[1000px] border-collapse text-left whitespace-nowrap">
        <thead>
          <tr className="border-b border-lp-border text-[11px] uppercase tracking-widest text-lp-text3">
            <th className="px-4 py-3 font-bold">Business</th>
            <th className="px-4 py-3 font-bold">GBPs</th>
            <th className="px-4 py-3 font-bold">Plan</th>
            <th className="px-4 py-3 font-bold">GBP Status</th>
            <th className="px-4 py-3 font-bold">Health Score</th>
            <th className="px-4 py-3 font-bold">Reviews</th>
            <th className="px-4 py-3 font-bold">Last Sync</th>
            <th className="px-4 py-3 font-bold">Posts/mo</th>
            <th className="px-4 py-3 font-bold">MRR</th>
            <th className="px-4 py-3 font-bold">Status</th>
            <th className="px-4 py-3 text-right font-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((business, index) => (
            <tr
              key={business.id}
              className="border-b border-lp-border transition last:border-b-0 hover:bg-lp-surface2/70 [&:last-child>td:first-child]:rounded-bl-xl [&:last-child>td:last-child]:rounded-br-xl"
            >
              <td className="min-w-[260px] px-4 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-lp-bg"
                    style={{
                      background:
                        index % 2 === 0
                          ? "linear-gradient(135deg, #B8FF57, #57D4FF)"
                          : "linear-gradient(135deg, #FF9F57, #B8FF57)",
                    }}
                  >
                    {initials(business.name)}
                  </div>
                  <div>
                    <div className="font-bold text-lp-text">{business.name}</div>
                    <div className="text-sm text-lp-text2">{business.location ?? "No location"}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-sm font-bold text-lp-text">{business.gbpCount}</td>
              <td className="px-4 py-4">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${business.meta.className}`}
                >
                  {business.meta.label}
                </span>
              </td>
              <td className="px-4 py-4">
                {business.gbp_connected ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-lp-accent/20 bg-lp-accent/10 px-2.5 py-1 text-xs font-bold text-lp-accent">
                    <CheckCircle2 className="size-3.5" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-lp-accent3/20 bg-lp-accent3/10 px-2.5 py-1 text-xs font-bold text-lp-accent3">
                    <Clock3 className="size-3.5" />
                    Not connected
                  </span>
                )}
              </td>
              <td className="min-w-[160px] px-4 py-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-bold text-lp-text">{business.health}</span>
                  <span className="text-lp-text3">100</span>
                </div>
                <div className="h-1.5 rounded-full bg-lp-surface3">
                  <div
                    className={`h-full rounded-full ${
                      business.health >= 80
                        ? "bg-lp-accent"
                        : business.health >= 60
                          ? "bg-lp-accent3"
                          : "bg-lp-red"
                    }`}
                    style={{ width: `${Math.min(business.health, 100)}%` }}
                  />
                </div>
              </td>
              <td className="px-4 py-4 text-sm font-bold text-lp-text">{business.total_reviews ?? 0}</td>
              <td className="px-4 py-4 text-sm text-lp-text2">{relativeTime(business.last_review_sync)}</td>
              <td className="px-4 py-4 text-sm text-lp-text">
                <span className="font-bold">{business.posts}</span>
                <span className="text-lp-text3">/{business.limit}</span>
              </td>
              <td className="px-4 py-4 text-sm font-bold text-lp-text">₹{business.meta.price.toLocaleString()}</td>
              <td className="px-4 py-4">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
                    business.status === "Active"
                      ? "border-lp-accent/20 bg-lp-accent/10 text-lp-accent"
                      : business.status === "Trial"
                        ? "border-lp-accent2/20 bg-lp-accent2/10 text-lp-accent2"
                        : "border-lp-accent3/20 bg-lp-accent3/10 text-lp-accent3"
                  }`}
                >
                  {business.status}
                </span>
              </td>
              <td className="relative px-4 py-4 text-right">
                <button
                  type="button"
                  onClick={() => setOpenMenu(openMenu === business.id ? null : business.id)}
                  className="inline-flex size-8 items-center justify-center rounded-lg text-lp-text2 transition hover:bg-lp-surface3 hover:text-lp-text"
                  aria-label={`Open actions for ${business.name}`}
                >
                  <MoreHorizontal className="size-5" />
                </button>
                {openMenu === business.id ? (
                  <div className="absolute right-4 top-12 z-20 w-44 rounded-xl border border-lp-border bg-lp-surface2 p-1 text-left shadow-glow">
                    <Link href={`/admin/clients/${business.id}`} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-lp-text2 hover:bg-lp-surface3 hover:text-lp-text">
                      <ExternalLink className="size-4" />
                      View Dashboard
                    </Link>
                    <button 
                      onClick={async () => {
                        if (confirm(`Are you sure you want to delete ${business.name}? This will delete the user and all their data permanently.`)) {
                          const res = await deleteClient(business.id);
                          if (!res.ok) alert(res.message);
                        }
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-lp-red hover:bg-lp-red/10"
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </button>
                  </div>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
