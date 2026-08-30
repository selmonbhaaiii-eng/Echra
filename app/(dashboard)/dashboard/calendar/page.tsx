import { FullCalendar } from "@/components/dashboard/FullCalendar";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: business } = user
    ? await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle()
    : { data: null };

  const { data: posts } = business
    ? await supabase
        .from("posts")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false })
        .limit(100) // fetch enough for calendar view
    : { data: [] };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-lp-text">Publishing Calendar</h1>
          <p className="mt-2 text-sm leading-6 text-lp-text2">
            View and manage your scheduled posts across all sources.
          </p>
        </div>
      </div>
      <FullCalendar posts={(posts || []).map(p => ({
        id: p.id,
        source_type: p.source_type ?? "manual",
        status: p.status ?? "draft",
        scheduled_at: p.scheduled_at,
        created_at: p.created_at ?? new Date().toISOString(),
        content: p.content
      }))} businessId={business?.id} />
    </div>
  );
}
