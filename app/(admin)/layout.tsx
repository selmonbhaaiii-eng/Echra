import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-lp-bg text-lp-text">
      <AdminSidebar />
      <div className="ml-[220px] min-h-screen">
        <header className="sticky top-0 z-30 flex h-[52px] items-center justify-between border-b border-lp-border bg-lp-bg/90 px-6 backdrop-blur-xl">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-lp-text3">
              Founder Console
            </p>
          </div>
        </header>
        <main className="px-6 py-7">{children}</main>
      </div>
    </div>
  );
}
