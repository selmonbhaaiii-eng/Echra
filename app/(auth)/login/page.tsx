"use client";

import { FormEvent, useState } from "react";
import { Activity, Mail, Lock, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialError = searchParams?.get("error");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(initialError ? "error" : "idle");
  const [message, setMessage] = useState(initialError ? `Error: ${initialError}` : "");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("success");
    setMessage("Successfully logged in! Redirecting...");
    
    // Redirect to dashboard
    router.push("/dashboard");
    router.refresh(); // Refresh to update server-side auth state
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
            Secure login
          </div>
          <h2 className="font-heading text-3xl font-bold text-lp-text">Welcome back</h2>
          <p className="mt-2 text-sm leading-6 text-lp-text2">
            Enter your email and password to sign in.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-lp-text2">Email address</span>
            <span className="flex items-center gap-2 rounded-lg border border-lp-border bg-lp-surface2 px-3 focus-within:border-lp-border2">
              <Mail className="size-4 text-lp-text3" />
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@business.com"
                className="h-12 w-full bg-transparent text-sm text-lp-text outline-none placeholder:text-lp-text3"
              />
            </span>
          </label>
          
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-lp-text2">Password</span>
            <span className="flex items-center gap-2 rounded-lg border border-lp-border bg-lp-surface2 px-3 focus-within:border-lp-border2">
              <Lock className="size-4 text-lp-text3" />
              <input
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="h-12 w-full bg-transparent text-sm text-lp-text outline-none placeholder:text-lp-text3"
              />
            </span>
          </label>

          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="h-11 w-full rounded-lg bg-lp-accent px-4 text-sm font-bold text-lp-bg transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 mt-6"
          >
            {status === "loading" ? "Signing in..." : "Sign in"}
          </button>
        </form>
        
        <div className="my-6 flex items-center justify-center space-x-4">
          <span className="h-[1px] w-full bg-lp-border"></span>
          <span className="text-xs text-lp-text3">OR</span>
          <span className="h-[1px] w-full bg-lp-border"></span>
        </div>

        <button
          onClick={async () => {
            setStatus("loading");
            setMessage("");
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                // We shouldn't request GBP scopes during initial login, only during the connect step
                // to avoid confusing users or failing the login if they don't grant it.
                queryParams: {
                  access_type: "offline",
                  prompt: "consent",
                }
              },
            });
            if (error) {
              setStatus("error");
              setMessage(error.message);
            }
          }}
          disabled={status === "loading" || status === "success"}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-lp-border bg-lp-surface2 px-4 text-sm font-medium text-lp-text transition hover:bg-lp-border2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        {message ? (
          <p
            className={`mt-4 rounded-lg border px-3 py-2 text-sm ${status === "error"
                ? "border-red-400/20 bg-red-400/10 text-lp-red"
                : "border-green-400/20 bg-green-400/10 text-green-500"
              }`}
          >
            {message}
          </p>
        ) : null}
        
        <p className="mt-6 text-center text-sm text-lp-text2">
          Don't have an account?{" "}
          <Link href="/signup" className="font-medium text-lp-accent hover:underline">
            Sign up
          </Link>
        </p>
      </section>
    </main>
  );
}
