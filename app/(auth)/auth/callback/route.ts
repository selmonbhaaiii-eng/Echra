import { NextResponse, type NextRequest } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.redirect(`${origin}/login?error=no_user`);
  }

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

  if (adminEmail && user.email.toLowerCase() === adminEmail) {
    const service = createServiceRoleClient();
    await service.from("profiles").upsert(
      {
        id: user.id,
        email: user.email,
        role: "admin",
      },
      { onConflict: "id" },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.redirect(`${origin}/login?error=no_profile`);
  }

  if (profile.role === "admin") {
    return NextResponse.redirect(`${origin}/admin/clients`);
  }

  const next = requestUrl.searchParams.get("next");
  if (next) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
