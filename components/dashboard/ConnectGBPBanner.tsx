import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

export function ConnectGBPBanner() {
  return (
    <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-lp-accent3/30 bg-lp-accent3/10 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-lp-accent3/15 text-lp-accent3">
          <AlertTriangle className="size-5" />
        </div>
        <div>
          <h2 className="font-heading text-lg sm:text-xl md:text-2xl font-bold text-lp-text">
            Your Google Business Profile is not connected yet.
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-lp-text2">
            Connect now to import reviews and start generating posts automatically.
          </p>
        </div>
      </div>
      <Link
        href="/dashboard/connect"
        className="inline-flex h-10 sm:h-11 items-center justify-center gap-2 rounded-lg bg-lp-accent px-4 text-sm font-bold text-lp-bg transition hover:brightness-95 shrink-0 w-full sm:w-auto"
      >
        Connect GBP
        <ArrowRight className="size-4" />
      </Link>
    </section>
  );
}
