"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, Zap } from "lucide-react";
import { ClientSidebar } from "./ClientSidebar";
import { SyncGBPProfileButton } from "./SyncGBPProfileButton";

interface DashboardShellProps {
  children: React.ReactNode;
  pendingCount: number;
  contextPercent: number;
  isGbpConnected: boolean;
  gbpLocationName: string;
  businessId: string;
}

export function DashboardShell({
  children,
  pendingCount,
  contextPercent,
  isGbpConnected,
  gbpLocationName,
  businessId,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile sidebar on route navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent scrolling when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-lp-bg text-lp-text">
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Responsive Sidebar Drawer */}
      <ClientSidebar
        pendingCount={pendingCount}
        contextPercent={contextPercent}
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex min-h-screen flex-col transition-all duration-200 lg:ml-[220px]">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-lp-border bg-lp-bg/95 px-3 sm:px-4 backdrop-blur-xl lg:px-6">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Hamburger Button for Mobile / Tablet */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-lp-border bg-lp-surface text-lp-text2 transition hover:bg-lp-surface2 hover:text-lp-text lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="size-5" />
            </button>

            {/* Mobile Logo Brand */}
            <div className="flex items-center gap-2 lg:hidden shrink-0">
              <div className="flex size-7 items-center justify-center rounded-md bg-lp-accent text-lp-bg">
                <Zap className="size-4 fill-current" />
              </div>
              <span className="font-heading text-sm font-extrabold text-lp-text">Echra</span>
            </div>

            {/* Desktop Section Title */}
            <p className="hidden text-[11px] font-bold uppercase tracking-widest text-lp-text3 lg:block">
              Business Dashboard
            </p>
          </div>

          {/* Right Status Badge */}
          <div className="flex items-center shrink-0">
            <div
              className={`flex items-center rounded-full border py-1 px-2.5 text-xs font-medium ${
                isGbpConnected
                  ? "border-lp-accent/30 bg-lp-accent/10 text-lp-accent"
                  : "border-lp-border bg-lp-surface text-lp-text2"
              }`}
            >
              <span className={`size-1.5 rounded-full mr-1.5 shrink-0 ${isGbpConnected ? "bg-lp-accent" : "bg-orange-400"}`} />
              {/* Short label on phone, full on desktop/tablet */}
              <span className="inline sm:hidden font-medium">
                {isGbpConnected ? "Connected" : "No GBP"}
              </span>
              <span className="hidden sm:inline truncate max-w-[180px] lg:max-w-xs font-medium">
                {isGbpConnected ? `GBP: ${gbpLocationName}` : "GBP not connected"}
              </span>
              {isGbpConnected && businessId && (
                <SyncGBPProfileButton businessId={businessId} />
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-3.5 py-5 sm:px-4 md:px-6 lg:px-6 lg:py-7 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
