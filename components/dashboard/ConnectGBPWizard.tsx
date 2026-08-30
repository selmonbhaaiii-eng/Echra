import Link from "next/link";
import { ArrowRight, Check, Loader2, ShieldCheck } from "lucide-react";

export function ConnectGBPWizard({
  connected,
  synced,
  error,
}: {
  connected: boolean;
  synced: string | null;
  error: string | null;
}) {
  if (connected) {
    return (
      <section className="mx-auto max-w-2xl rounded-xl border border-lp-accent/30 bg-lp-surface p-8 text-center shadow-glow">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-lp-accent/15 text-lp-accent">
          <Check className="size-8" />
        </div>
        <h1 className="mt-6 font-heading text-3xl font-bold text-lp-text">You&apos;re connected</h1>
        <p className="mt-3 text-sm leading-6 text-lp-text2">
          {Number(synced ?? 0)} reviews imported. Your first AI-generated posts will be ready in
          Phase 3.
        </p>
        <Link
          href="/dashboard"
          className="mt-7 inline-flex h-11 items-center gap-2 rounded-lg bg-lp-accent px-5 text-sm font-bold text-lp-bg transition hover:brightness-95"
        >
          Go to Dashboard
          <ArrowRight className="size-4" />
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl rounded-xl border border-lp-border bg-lp-surface p-8 shadow-glow">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-xl bg-lp-accent/15 text-lp-accent">
          <ShieldCheck className="size-7" />
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-lp-accent">Step 1 of 3</p>
          <h1 className="mt-1 font-heading text-3xl font-bold text-lp-text">
            Connect your Google Business Profile
          </h1>
        </div>
      </div>

      <p className="max-w-2xl text-sm leading-6 text-lp-text2">
        Echra needs access to your Google Business Profile to pull reviews and publish posts on
        your behalf once Phase 3 is active.
      </p>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        {["Read your Google reviews", "See your business information", "Publish posts later"].map(
          (item) => (
            <div key={item} className="rounded-xl border border-lp-border bg-lp-surface2 p-4">
              <Check className="mb-3 size-5 text-lp-accent" />
              <p className="text-sm font-medium leading-5 text-lp-text">{item}</p>
            </div>
          ),
        )}
      </div>

      {error ? (
        <div className="mt-6 rounded-xl border border-lp-red/30 bg-lp-red/10 p-4 text-sm text-lp-red">
          {decodeURIComponent(error)}
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href="/api/auth/google/connect"
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-lp-accent px-5 text-sm font-bold text-lp-bg transition hover:brightness-95"
        >
          Connect with Google
          <ArrowRight className="size-4" />
        </Link>
        <span className="inline-flex items-center gap-2 text-sm text-lp-text2">
          <Loader2 className="size-4 animate-spin text-lp-text3" />
          After approval, reviews sync automatically.
        </span>
      </div>
    </section>
  );
}
