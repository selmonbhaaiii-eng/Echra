"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { getHolidaysForMonth } from "@/lib/utils/holidays";

type CalendarPost = {
  id: string;
  source_type: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
};

export function MiniCalendar({ posts = [] }: { posts?: CalendarPost[] }) {
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

  // Determine scheduled days from posts
  const getDaysWithPosts = () => {
    const days = new Set<number>();
    posts.forEach(post => {
      // Use scheduled_at if available, else fallback to created_at
      const dateStr = post.scheduled_at || post.created_at;
      if (!dateStr) return;

      const postDate = new Date(dateStr);
      if (postDate.getMonth() === currentDate.getMonth() && postDate.getFullYear() === currentDate.getFullYear()) {
        days.add(postDate.getDate());
      }
    });
    return Array.from(days);
  };

  const scheduledDays = getDaysWithPosts();

  // Get holidays for the current month
  const monthHolidays = getHolidaysForMonth(currentDate.getMonth());

  return (
    <div className="rounded-xl border border-lp-border bg-lp-surface p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="size-5 text-lp-accent" />
          <h2 className="font-heading text-xl font-bold text-lp-text">Publishing Calendar</h2>
        </div>
        <Link href="/dashboard/calendar" className="text-sm font-bold text-lp-accent hover:underline">
          Full view →
        </Link>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className="font-heading text-lg font-bold text-lp-text">
          {monthName} {year}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="flex size-7 items-center justify-center rounded-md border border-lp-border bg-lp-surface2 text-lp-text3 hover:bg-lp-surface3 hover:text-lp-text"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={nextMonth}
            className="flex size-7 items-center justify-center rounded-md border border-lp-border bg-lp-surface2 text-lp-text3 hover:bg-lp-surface3 hover:text-lp-text"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
          <div key={i} className="py-2 text-center text-xs font-bold uppercase tracking-widest text-lp-text3">
            {day}
          </div>
        ))}

        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square rounded-lg" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isToday = isCurrentMonth && day === today.getDate();
          const hasPost = scheduledDays.includes(day);
          const holiday = monthHolidays.find(h => h.day === day);

          return (
            <div
              key={day}
              title={holiday?.name}
              className={`relative flex aspect-square cursor-pointer items-center justify-center rounded-lg text-sm transition-colors ${isToday
                  ? "bg-lp-accent/15 font-bold text-lp-accent"
                  : hasPost || holiday
                    ? "font-bold text-lp-text hover:bg-lp-surface3"
                    : "text-lp-text3 hover:bg-lp-surface3"
                } ${holiday && !isToday && !hasPost ? "text-purple-400" : ""}`}
            >
              {day}
              <div className="absolute bottom-1.5 flex gap-1">
                {hasPost && !isToday && (
                  <span className="size-1 rounded-full bg-lp-accent" />
                )}
                {holiday && !isToday && (
                  <span className="size-1 rounded-full bg-purple-500" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs font-medium text-lp-text3">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-lp-accent" /> Scheduled Post
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-purple-500" /> Holiday / Event
        </div>
      </div>
    </div>
  );
}
