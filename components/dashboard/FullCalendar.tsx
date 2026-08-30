"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles } from "lucide-react";
import { getHolidaysForMonth } from "@/lib/utils/holidays";
import { useRouter } from "next/navigation";

type CalendarPost = {
  id: string;
  source_type: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  content: string;
};

export function FullCalendar({ posts = [], businessId }: { posts?: CalendarPost[]; businessId?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const hasGeneratedRef = useRef(false);

  useEffect(() => {
    if (!businessId || hasGeneratedRef.current) return;
    hasGeneratedRef.current = true;

    fetch("/api/calendar/generate-drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business_id: businessId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.processed && data.processed > 0) {
          startTransition(() => router.refresh());
        }
      })
      .catch(console.error);
  }, [businessId, router]);
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();
  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

  // Map database posts to calendar visual format
  const mappedPosts = posts.map(post => {
    const dateStr = post.scheduled_at || post.created_at;
    const date = dateStr ? new Date(dateStr) : new Date();

    // Short title derived from content
    const title = post.content ? post.content.substring(0, 30) + "..." : "Draft Post";

    return {
      id: post.id,
      day: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      type: post.source_type || "manual",
      title,
      fullDate: date
    };
  });

  // Filter posts for the currently viewed month
  const currentMonthPosts = mappedPosts.filter(
    p => p.month === currentDate.getMonth() && p.year === currentDate.getFullYear()
  ).sort((a, b) => a.day - b.day);

  // Future posts for the Upcoming list (from today onwards, regardless of month, limit 5)
  const upcomingPosts = mappedPosts
    .filter(p => p.fullDate.getTime() >= new Date().setHours(0, 0, 0, 0))
    .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime())
    .slice(0, 5);

  const monthHolidays = getHolidaysForMonth(currentDate.getMonth());

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_300px] xl:items-start">
      <div className="rounded-xl border border-lp-border bg-lp-surface">
        <div className="flex items-center justify-between border-b border-lp-border p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-lp-surface2">
              <CalendarIcon className="size-5 text-lp-text" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-lp-text">
                {monthName} {year}
              </h2>
              <p className="text-sm text-lp-text3">Scheduled publishing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="flex size-9 items-center justify-center rounded-lg border border-lp-border bg-lp-surface2 text-lp-text3 transition hover:bg-lp-surface3 hover:text-lp-text"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={nextMonth}
              className="flex size-9 items-center justify-center rounded-lg border border-lp-border bg-lp-surface2 text-lp-text3 transition hover:bg-lp-surface3 hover:text-lp-text"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-2 grid grid-cols-7 gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
              <div key={i} className="text-center text-xs font-bold uppercase tracking-widest text-lp-text3">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] rounded-lg border border-transparent" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = isCurrentMonth && day === today.getDate();
              // For simplicity, we just show the first post on that day if multiple exist
              const post = currentMonthPosts.find((p) => p.day === day);
              const holiday = monthHolidays.find((h) => h.day === day);

              return (
                <div
                  key={day}
                  className={`flex min-h-[80px] cursor-pointer flex-col gap-1 rounded-lg border p-2 transition ${isToday
                      ? "border-lp-accent/40 bg-lp-accent/5"
                      : "border-lp-border bg-lp-surface2 hover:border-lp-border2 hover:bg-lp-surface3"
                    }`}
                >
                  <span className={`text-xs font-bold ${isToday ? "text-lp-accent" : "text-lp-text2"}`}>
                    {day}
                  </span>

                  {holiday && (
                    <div className="mt-1 truncate rounded px-1.5 py-1 text-[10px] font-medium bg-purple-500/15 text-purple-400">
                      🎉 {holiday.name}
                    </div>
                  )}

                  {post && (
                    <div
                      className={`mt-1 truncate rounded px-1.5 py-1 text-[10px] font-medium ${post.type === "review"
                          ? "bg-emerald-500/15 text-emerald-500"
                          : post.type === "seasonal"
                            ? "bg-orange-500/15 text-orange-500"
                            : post.type === "event"
                              ? "bg-blue-500/15 text-blue-500"
                              : "bg-gray-400/15 text-gray-400"
                        }`}
                    >
                      {post.title}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 border-t border-lp-border px-6 py-4 text-xs font-medium text-lp-text3">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded bg-purple-500" /> Holiday
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded bg-emerald-500" /> From Review
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded bg-orange-500" /> Seasonal
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded bg-blue-500" /> Event
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-lp-border bg-lp-surface p-6">
        <h3 className="mb-4 font-heading text-lg font-bold text-lp-text">Upcoming</h3>

        <div className="space-y-4">
          {upcomingPosts.length > 0 ? (
            upcomingPosts.map((post) => (
              <div key={post.id} className="flex gap-4 border-b border-lp-border pb-4 last:border-0 last:pb-0">
                <div className="text-center">
                  <div className="font-heading text-xl font-bold text-lp-text">{post.day}</div>
                  <div className="text-xs text-lp-text3">
                    {post.fullDate.toLocaleString("default", { month: "short" })}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-lp-text3 mb-1">
                        {post.type}
                      </div>
                      <div className="text-sm font-medium text-lp-text truncate max-w-[180px]">{post.title}</div>
                    </div>
                    {posts.find(p => p.id === post.id)?.status === "pending_approval" ? (
                      <button 
                        onClick={() => {
                          fetch("/api/posts/approve", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ post_id: post.id })
                          }).then(() => {
                            startTransition(() => router.refresh());
                          });
                        }}
                        className="inline-flex h-7 items-center rounded-lg bg-lp-accent px-2.5 text-[11px] font-bold text-lp-bg transition hover:opacity-90"
                      >
                        Approve
                      </button>
                    ) : (
                       <span className="text-[11px] font-bold text-lp-text3">Scheduled</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="mt-4 flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-lp-border2 bg-lp-bg/40 p-4 text-center">
              <div>
                <Sparkles className="mx-auto size-5 text-lp-text3" />
                <p className="mt-2 text-xs leading-5 text-lp-text2">
                  No upcoming posts.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
