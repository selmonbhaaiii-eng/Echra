"use client";

import { FormEvent, useState, useEffect, useMemo } from "react";
import { Activity, Lock, Mail, User, Sparkles, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      
      if (data.session && data.session.user) {
        const user = data.session.user;
        setEmail(user.email ?? "");

        try {
          // Fetch existing profile or business name if already provisioned
          const [profileRes, businessRes] = await Promise.all([
            supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
            supabase.from("businesses").select("name").eq("owner_id", user.id).maybeSingle(),
          ]);

          if (profileRes.data?.full_name) {
            setFullName(profileRes.data.full_name);
          }
          if (businessRes.data?.name) {
            setBusinessName(businessRes.data.name);
          }
        } catch {
          // Non-critical: continue with defaults
        }

        setStatus("idle");
      } else {
        // If no session exists, the link is either missing the token or the token was already consumed
        setStatus("invalid_link");
        setMessage("This invite link is invalid or has already been used. Please ask your administrator to send a new invite.");
      }
    }, 1000);

    return () => { mounted = false; };
  }, [supabase]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 6) {
      setStatus("error");
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match. Please verify both passwords.");
      return;
    }

    setStatus("loading");
    setMessage("");

    // 1. Update password and metadata in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.updateUser({
      password,
      data: {
        full_name: fullName.trim() || undefined,
      },
    });

    if (authError) {
      setStatus("error");
      setMessage(authError.message);
      return;
    }

    // 2. Update profiles table with full_name if provided
    if (authData.user && fullName.trim()) {
      await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", authData.user.id);
    }

    setStatus("success");
    setMessage("Account activated successfully! Redirecting to your dashboard...");
    
    // Redirect to dashboard
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh(); // Refresh to update server-side auth state
    }, 1200);
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
            <p className="text-lp-text2 font-medium">Verifying your invitation...</p>
          </div>
        ) : status === "invalid_link" ? (
          <div className="rounded-lg bg-red-500/10 p-5 border border-red-500/20">
            <h3 className="text-red-500 font-bold mb-2">Invalid or Expired Invite Link</h3>
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
            <div className="mb-6">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-lp-border2 bg-lp-surface2 px-3 py-1 text-xs font-medium text-lp-accent">
                <Sparkles className="size-3.5" />
                Accept Invitation
              </div>
              <h2 className="font-heading text-3xl font-bold text-lp-text">Welcome to Echra!</h2>
              <p className="mt-2 text-sm leading-6 text-lp-text2">
                {businessName ? (
                  <>
                    You&apos;ve been invited to manage{" "}
                    <strong className="text-lp-text font-semibold">{businessName}</strong>. Complete your account details below.
                  </>
                ) : (
                  "Complete your account setup below to activate your access and enter your dashboard."
                )}
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {/* Email Address (Read-only) */}
              <label className="block">
                <span className="mb-2 flex items-center justify-between text-sm font-medium text-lp-text2">
                  <span>Invited Email</span>
                  <span className="flex items-center gap-1 text-xs text-lp-accent font-medium">
                    <CheckCircle2 className="size-3.5" /> Verified
                  </span>
                </span>
                <span className="flex items-center gap-2 rounded-lg border border-lp-border/80 bg-lp-surface2/60 px-3 opacity-90">
                  <Mail className="size-4 text-lp-text3" />
                  <input
                    readOnly
                    type="email"
                    value={email}
                    className="h-11 w-full bg-transparent text-sm text-lp-text cursor-not-allowed outline-none"
                  />
                </span>
              </label>

              {/* Full Name */}
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-lp-text2">Full Name</span>
                <span className="flex items-center gap-2 rounded-lg border border-lp-border bg-lp-surface2 px-3 focus-within:border-lp-border2">
                  <User className="size-4 text-lp-text3" />
                  <input
                    required
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Enter your name"
                    className="h-11 w-full bg-transparent text-sm text-lp-text outline-none placeholder:text-lp-text3"
                  />
                </span>
              </label>

              {/* New Password */}
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-lp-text2">Create Password</span>
                <span className="flex items-center gap-2 rounded-lg border border-lp-border bg-lp-surface2 px-3 focus-within:border-lp-border2">
                  <Lock className="size-4 text-lp-text3" />
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 6 characters"
                    className="h-11 w-full bg-transparent text-sm text-lp-text outline-none placeholder:text-lp-text3"
                    minLength={6}
                  />
                </span>
              </label>

              {/* Confirm Password */}
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-lp-text2">Confirm Password</span>
                <span className="flex items-center gap-2 rounded-lg border border-lp-border bg-lp-surface2 px-3 focus-within:border-lp-border2">
                  <Lock className="size-4 text-lp-text3" />
                  <input
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your password"
                    className="h-11 w-full bg-transparent text-sm text-lp-text outline-none placeholder:text-lp-text3"
                    minLength={6}
                  />
                </span>
              </label>

              <button
                type="submit"
                disabled={status === "loading" || status === "success"}
                className="h-11 w-full rounded-lg bg-lp-accent px-4 text-sm font-bold text-lp-bg transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 !mt-6 shadow-sm"
              >
                {status === "loading" ? "Activating Account..." : "Activate Account & Enter Dashboard"}
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
