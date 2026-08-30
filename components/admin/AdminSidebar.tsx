"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  DollarSign,
  FileText,
  Grid2X2,
  LogOut,
  RadioTower,
  Users,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const mainNav = [
  { label: "Dashboard", href: "/admin", icon: Grid2X2 },
  { label: "Clients", href: "/admin/clients", icon: Users },
  { label: "Billing", href: "/admin/billing", icon: DollarSign },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];

const settingsNav = [
  { label: "Automation Rules", href: "/admin/automation", icon: RadioTower },
  { label: "Prompt Library", href: "/admin/prompts", icon: FileText },
  { label: "API Usage", href: "/admin/api-usage", icon: Activity },
];

function NavSection({
  title,
  items,
}: {
  title: string;
  items: typeof mainNav;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-2">
      <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-lp-text3">{title}</p>
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition ${
                isActive
                  ? "bg-lp-accent/10 text-lp-accent"
                  : "text-lp-text2 hover:bg-lp-surface2 hover:text-lp-text"
              }`}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function AdminSidebar() {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col border-r border-lp-border bg-lp-surface px-3 py-4">
      <Link href="/admin/clients" className="mb-8 flex items-center gap-3 px-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-lp-accent text-lp-bg">
          <Zap className="size-5 fill-current" />
        </div>
        <div>
          <div className="font-heading text-lg font-extrabold text-lp-text">Echra</div>
          <div className="text-xs text-lp-text2">GBP Content Engine</div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-7">
        <NavSection title="Main" items={mainNav} />
        <NavSection title="Settings" items={settingsNav} />
      </div>

      <div className="space-y-3 border-t border-lp-border pt-4">
        <div className="rounded-xl border border-lp-border bg-lp-surface2 p-3">
          <div className="text-sm font-bold text-lp-text">Mohd. Onais</div>
          <div className="mt-1 inline-flex rounded-full bg-lp-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-lp-accent">
            Admin
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-lp-border bg-lp-surface2 text-sm font-medium text-lp-text2 transition hover:bg-lp-surface3 hover:text-lp-text"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
