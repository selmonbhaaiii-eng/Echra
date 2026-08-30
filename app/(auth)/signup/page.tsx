"use client";

import { FormEvent, useState } from "react";
import { Activity, Mail, Lock, User, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: "client",
        },
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("success");
    setMessage("Account created successfully! You can now log in.");

    // Optional: Redirect to login after a short delay
    setTimeout(() => {
      router.push("/login");
    }, 2000);
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
            Create Account
          </div>
          <h2 className="font-heading text-3xl font-bold text-lp-text">Get Started</h2>
          <p className="mt-2 text-sm leading-6 text-lp-text2">
            Enter your details to create a new account.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-lp-text2">Full Name</span>
            <span className="flex items-center gap-2 rounded-lg border border-lp-border bg-lp-surface2 px-3 focus-within:border-lp-border2">
              <User className="size-4 text-lp-text3" />
              <input
                required
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="John Doe"
                className="h-12 w-full bg-transparent text-sm text-lp-text outline-none placeholder:text-lp-text3"
              />
            </span>
          </label>

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
                minLength={6}
                className="h-12 w-full bg-transparent text-sm text-lp-text outline-none placeholder:text-lp-text3"
              />
            </span>
          </label>

          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="h-11 w-full rounded-lg bg-lp-accent px-4 text-sm font-bold text-lp-bg transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 mt-6"
          >
            {status === "loading" ? "Creating account..." : "Sign up"}
          </button>
        </form>

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
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-lp-accent hover:underline">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
