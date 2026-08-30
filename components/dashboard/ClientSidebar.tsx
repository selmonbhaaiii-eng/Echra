"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  Edit3,
  Grid2X2,
  LogOut,
  MessageSquareText,
  RadioTower,
  Settings,
  Users,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const mainNav = [
  { label: "Dashboard", href: "/dashboard", icon: Grid2X2 },
  { label: "Post Queue", href: "/dashboard/queue", icon: Edit3 },
  { label: "Reviews", href: "/dashboard/reviews", icon: MessageSquareText, dot: true },
  { label: "Calendar", href: "/dashboard/calendar", icon: CalendarDays },
];

const settingsNav = [
  { label: "Automation Rules", href: "/dashboard/automation", icon: RadioTower },
  { label: "Profile Settings", href: "/dashboard/settings/profile", icon: Settings },
];

interface NavItemProps {
  item: {
    label: string;
    href: string;
    icon: any;
    dot?: boolean;
    badge?: string | number | null;
  };
}

function NavItem({ item }: NavItemProps) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      className={`flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition ${
        isActive
          ? "bg-lp-accent/10 text-lp-accent"
          : "text-lp-text2 hover:bg-lp-surface2 hover:text-lp-text"
      }`}
    >
      <Icon className="size-4" />
      <span className="flex-1">{item.label}</span>
      {"badge" in item && item.badge ? (
        <span className="rounded-full bg-lp-accent px-2 py-0.5 text-[10px] font-bold text-lp-bg">
          {item.badge}
        </span>
      ) : null}
      {"dot" in item && item.dot ? <span className="size-2 rounded-full bg-lp-accent2" /> : null}
    </Link>
  );
}

export function ClientSidebar({ 
  showAgencyClients = false,
  pendingCount = 0,
  contextPercent = 0
}: { 
  showAgencyClients?: boolean;
  pendingCount?: number;
  contextPercent?: number;
}) {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col border-r border-lp-border bg-lp-surface px-3 py-4">
      <Link href="/dashboard" className="mb-8 flex items-center gap-3 px-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-lp-accent text-lp-bg">
          <Zap className="size-5 fill-current" />
        </div>
        <div>
          <div className="font-heading text-lg font-extrabold text-lp-text">Echra</div>
          <div className="text-xs text-lp-text2">Owner Console</div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-7">
        <div className="space-y-2">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-lp-text3">Main</p>
          <nav className="space-y-1">
            {mainNav.map((item) => {
              const currentItem = { ...item } as any;
              if (currentItem.label === "Post Queue") {
                currentItem.badge = pendingCount > 0 ? pendingCount.toString() : undefined;
              }
              return <NavItem key={currentItem.href} item={currentItem} />;
            })}
          </nav>
        </div>

        {showAgencyClients ? (
          <div className="space-y-2">
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-lp-text3">Grow</p>
            <NavItem item={{ label: "Clients", href: "/dashboard/clients", icon: Users }} />
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-lp-text3">
            Settings
          </p>
          <nav className="space-y-1">
            {settingsNav.map((item) => (
              <NavItem key={item.label} item={item} />
            ))}
          </nav>
        </div>
      </div>

      <div className="space-y-3 border-t border-lp-border pt-4">
        <Link 
          href="/dashboard/settings/profile" 
          className="flex w-full items-center gap-2 rounded-xl border border-lp-border bg-lp-surface2 p-3 text-left transition hover:bg-lp-surface3"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-lp-accent2/20 text-xs font-bold text-lp-accent2">
            LP
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-lp-text mb-1">Your Business</span>
            
            {/* Progress Bar added here */}
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex-1 h-1.5 bg-lp-surface3 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-lp-accent3 rounded-full transition-all"
                  style={{ width: `${contextPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-lp-text3">{contextPercent}%</span>
            </div>
            
          </span>
          <ChevronDown className="size-4 text-lp-text3" />
        </Link>
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
