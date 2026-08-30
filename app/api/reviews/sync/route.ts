import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncReviewsForBusiness } from "@/lib/sync/review-sync";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const query = supabase
    .from("businesses")
    .select("id,gbp_connected")
    .limit(1);

  const { data: business } =
    profile?.role === "admin"
      ? await query.maybeSingle()
      : await query.eq("owner_id", user.id).maybeSingle();

  if (!business) {
    return NextResponse.json({ success: false, error: "No business found" }, { status: 404 });
  }

  if (!business.gbp_connected) {
    return NextResponse.json(
      { success: false, error: "Google Business Profile is not connected." },
      { status: 400 },
    );
  }

  const result = await syncReviewsForBusiness(business.id);

  if (result.error) {
    return NextResponse.json({ success: false, ...result }, { status: 400 });
  }

  return NextResponse.json({ success: true, ...result });
}
