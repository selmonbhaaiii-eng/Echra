"use client";

import { FormEvent, useState } from "react";
import { Activity, Lock, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("success");
    setMessage("Password updated successfully! Redirecting...");
    
    // Redirect to dashboard
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh(); // Refresh to update server-side auth state
    }, 1500);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="w-full max-w-md rounded-xl border border-lp-border bg-lp-surface p-7 shadow-glow">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-lp-accent text-lp-bg">
            <Activity className="size-5" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-extrabold text-lp-text">Echra</h1>
            <p className="text-sm text-lp-text2">GBP Content Engine</p>
          </div>
        </div>

        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-lp-border2 bg-lp-surface2 px-3 py-1 text-xs font-medium text-lp-accent">
            <Sparkles className="size-3.5" />
            Set password
          </div>
          <h2 className="font-heading text-3xl font-bold text-lp-text">Set your password</h2>
          <p className="mt-2 text-sm leading-6 text-lp-text2">
            Since this is your first time logging in, please set a password to use for future logins.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-lp-text2">New Password</span>
            <span className="flex items-center gap-2 rounded-lg border border-lp-border bg-lp-surface2 px-3 focus-within:border-lp-border2">
              <Lock className="size-4 text-lp-text3" />
              <input
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="h-12 w-full bg-transparent text-sm text-lp-text outline-none placeholder:text-lp-text3"
                minLength={6}
              />
            </span>
          </label>

          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="h-11 w-full rounded-lg bg-lp-accent px-4 text-sm font-bold text-lp-bg transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 mt-6"
          >
            {status === "loading" ? "Updating..." : "Save Password"}
          </button>
        </form>

        {message && (
          <div
            className={`mt-6 rounded-lg p-3 text-sm ${
              status === "error"
                ? "bg-red-500/10 text-red-500 border border-red-500/20"
                : "bg-green-500/10 text-green-500 border border-green-500/20"
            }`}
          >
            {message}
          </div>
        )}
      </section>
    </main>
  );
}
