import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { syncReviewsForBusiness } from "@/lib/sync/review-sync";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("gbp_connected", true)
    .eq("plan_status", "active");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const results = [];

  for (const business of businesses ?? []) {
    const result = await syncReviewsForBusiness(business.id);
    results.push({ id: business.id, ...result });
  }

  return NextResponse.json({ synced: results.length, results });
}
