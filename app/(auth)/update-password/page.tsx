"use client";

import { FormEvent, useState, useEffect, useMemo } from "react";
import { Activity, Lock, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"verifying" | "idle" | "loading" | "success" | "error" | "invalid_link">("verifying");
  const [message, setMessage] = useState("");
  const router = useRouter();
  
  // Create the client exactly once and reuse it so the in-memory session is preserved
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let mounted = true;

    // Wait a brief moment to allow the Supabase client to parse the URL hash
    setTimeout(async () => {
      if (!mounted) return;
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        setStatus("idle");
      } else {
        // If no session exists, the link is either missing the token or the token was already consumed
        setStatus("invalid_link");
        setMessage("This invite link is invalid or has already been used. (Remember: Invite links can only be clicked once). Please ask your admin to send a new invite.");
      }
    }, 1000);

    return () => { mounted = false; };
  }, [supabase]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    // We use the exact same client instance that successfully verified the session
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

        {status === "verifying" ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-lp-accent border-t-transparent"></div>
            <p className="text-lp-text2 font-medium">Securing your session...</p>
          </div>
        ) : status === "invalid_link" ? (
          <div className="rounded-lg bg-red-500/10 p-5 border border-red-500/20">
            <h3 className="text-red-500 font-bold mb-2">Invalid Invite Link</h3>
            <p className="text-sm text-red-400 mb-4">{message}</p>
            <button 
              onClick={() => router.push('/login')}
              className="w-full bg-lp-surface2 text-lp-text px-4 py-2 rounded-lg border border-lp-border hover:bg-lp-border"
            >
              Go to Login Page
            </button>
          </div>
        ) : (
          <>
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
          </>
        )}
      </section>
    </main>
  );
}
