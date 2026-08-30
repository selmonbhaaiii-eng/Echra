import { NextResponse } from "next/server";
import { buildGoogleAuthUrl } from "@/lib/google/oauth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!business) {
    return NextResponse.redirect(new URL("/dashboard/connect?error=no_business", url.origin));
  }

  try {
    return NextResponse.redirect(buildGoogleAuthUrl(business.id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google OAuth is not configured.";
    const redirect = new URL("/dashboard/connect", url.origin);
    redirect.searchParams.set("error", message);
    return NextResponse.redirect(redirect);
  }
}
