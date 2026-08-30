"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    
    // When using the Admin API to send invites, Supabase uses the implicit flow 
    // which puts the access_token in the URL hash instead of a ?code parameter.
    // The createClient() automatically parses this hash and establishes the session!
    
    const checkSession = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      
      if (session) {
        // Wait a moment for cookies to flush
        setTimeout(() => {
          router.push("/update-password");
          router.refresh();
        }, 500);
      }
    };

    checkSession();

    // Also listen for auth state changes just in case parsing takes a moment
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setTimeout(() => {
          router.push("/update-password");
          router.refresh();
        }, 500);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center p-5">
      <div className="flex flex-col items-center justify-center space-y-4">
        {error ? (
          <div className="text-red-500 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
            Error: {error}. Please try logging in normally.
          </div>
        ) : (
          <>
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-lp-accent border-t-transparent"></div>
            <p className="text-lp-text2 font-medium">Verifying your secure invite...</p>
          </>
        )}
      </div>
    </main>
  );
}
