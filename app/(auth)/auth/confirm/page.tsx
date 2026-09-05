"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Verifying your secure invite...");

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    
    const checkHashAndSession = async () => {
      // Check if there is even a hash in the URL
      if (!window.location.hash || !window.location.hash.includes("access_token")) {
        if (mounted) setError("No secure invite token found in the URL. Please click the exact link from your email.");
        return;
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          if (mounted) setError(sessionError.message);
          return;
        }
        
        if (session) {
          if (mounted) setStatus("Invite verified! Redirecting...");
          setTimeout(() => {
            if (mounted) {
              router.push("/update-password");
              router.refresh();
            }
          }, 500);
        } else {
          // If session is still null after checking, give it 3 seconds for onAuthStateChange to catch it
          setTimeout(() => {
            if (mounted && !error) {
               supabase.auth.getSession().then(({ data }) => {
                 if (!data.session) {
                   setError("Failed to verify the invite token. The link may have expired or been used already.");
                 }
               });
            }
          }, 3000);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || "An unknown error occurred");
      }
    };

    checkHashAndSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        if (mounted) setStatus("Invite verified! Redirecting...");
        setTimeout(() => {
          if (mounted) {
            router.push("/update-password");
            router.refresh();
          }
        }, 500);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, error]);

  return (
    <main className="flex min-h-screen items-center justify-center p-5">
      <div className="flex flex-col items-center justify-center space-y-4">
        {error ? (
          <div className="text-red-500 bg-red-500/10 p-4 rounded-lg border border-red-500/20 max-w-md text-center">
            <strong>Error:</strong> {error}
            <div className="mt-4">
              <button 
                onClick={() => router.push('/login')}
                className="bg-red-500 text-white px-4 py-2 rounded font-medium"
              >
                Go to Login
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-lp-accent border-t-transparent"></div>
            <p className="text-lp-text2 font-medium">{status}</p>
          </>
        )}
      </div>
    </main>
  );
}
