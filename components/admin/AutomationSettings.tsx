"use client";

import { useState } from "react";
import { Sparkles, Calendar, CalendarRange, MessagesSquare } from "lucide-react";

export function AutomationSettings() {
  const [autopilot, setAutopilot] = useState(false);
  const [seasonal, setSeasonal] = useState(true);
  const [events, setEvents] = useState(false);
  const [reviews, setReviews] = useState(true);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-xl border border-lp-border bg-lp-surface p-6 transition hover:border-lp-border2">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-lp-accent/10 text-lp-accent">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-lp-text">Global Autopilot</h3>
              <p className="mt-1 text-sm leading-6 text-lp-text2">
                Auto-publish generated posts without requiring client approval first.
              </p>
            </div>
          </div>
          <button
            onClick={() => setAutopilot(!autopilot)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-lp-border transition-colors duration-200 ease-in-out ${
              autopilot ? "bg-lp-accent" : "bg-lp-surface3"
            }`}
          >
            <span
              className={`inline-block size-5 transform rounded-full bg-lp-bg transition duration-200 ease-in-out ${
                autopilot ? "translate-x-5" : "translate-x-0.5"
              } mt-px`}
            />
          </button>
        </div>
        <div className="mt-4 space-y-3 rounded-lg border border-lp-border bg-lp-surface2 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-lp-text2">Monthly Default Limit</span>
            <span className="rounded-md border border-lp-border bg-lp-bg px-3 py-1 text-sm font-bold text-lp-text">
              15 posts
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-lp-accent/10 px-2 py-1 text-xs font-bold text-lp-accent">High Risk</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-lp-border bg-lp-surface p-6 transition hover:border-lp-border2">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-lp-accent2/10 text-lp-accent2">
              <Calendar className="size-5" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-lp-text">Seasonal Auto-Drafts</h3>
              <p className="mt-1 text-sm leading-6 text-lp-text2">
                Draft posts for major holidays and festivals 5 days in advance.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSeasonal(!seasonal)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-lp-border transition-colors duration-200 ease-in-out ${
              seasonal ? "bg-lp-accent2" : "bg-lp-surface3"
            }`}
          >
            <span
              className={`inline-block size-5 transform rounded-full bg-lp-bg transition duration-200 ease-in-out ${
                seasonal ? "translate-x-5" : "translate-x-0.5"
              } mt-px`}
            />
          </button>
        </div>
        <div className="mt-4 space-y-3 rounded-lg border border-lp-border bg-lp-surface2 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-lp-text2">Lead Time</span>
            <span className="rounded-md border border-lp-border bg-lp-bg px-3 py-1 text-sm font-bold text-lp-text">
              5 days
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-lp-accent2/10 px-2 py-1 text-xs font-bold text-lp-accent2">Recommended</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-lp-border bg-lp-surface p-6 transition hover:border-lp-border2">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-lp-accent3/10 text-lp-accent3">
              <CalendarRange className="size-5" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-lp-text">Local Events Tracker</h3>
              <p className="mt-1 text-sm leading-6 text-lp-text2">
                Monitor city-wide events (ex: Bandra Fair) and draft tie-in posts.
              </p>
            </div>
          </div>
          <button
            onClick={() => setEvents(!events)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-lp-border transition-colors duration-200 ease-in-out ${
              events ? "bg-lp-accent3" : "bg-lp-surface3"
            }`}
          >
            <span
              className={`inline-block size-5 transform rounded-full bg-lp-bg transition duration-200 ease-in-out ${
                events ? "translate-x-5" : "translate-x-0.5"
              } mt-px`}
            />
          </button>
        </div>
        <div className="mt-4 space-y-3 rounded-lg border border-lp-border bg-lp-surface2 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-lp-text2">Search Radius</span>
            <span className="rounded-md border border-lp-border bg-lp-bg px-3 py-1 text-sm font-bold text-lp-text">
              10 km
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-lp-accent3/10 px-2 py-1 text-xs font-bold text-lp-accent3">Beta feature</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-lp-border bg-lp-surface p-6 transition hover:border-lp-border2">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-lp-red/10 text-lp-red">
              <MessagesSquare className="size-5" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-lp-text">Review Post Extraction</h3>
              <p className="mt-1 text-sm leading-6 text-lp-text2">
                Auto-generate posts for any incoming Google review rated 4 stars or higher.
              </p>
            </div>
          </div>
          <button
            onClick={() => setReviews(!reviews)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-lp-border transition-colors duration-200 ease-in-out ${
              reviews ? "bg-lp-red" : "bg-lp-surface3"
            }`}
          >
            <span
              className={`inline-block size-5 transform rounded-full bg-lp-bg transition duration-200 ease-in-out ${
                reviews ? "translate-x-5" : "translate-x-0.5"
              } mt-px`}
            />
          </button>
        </div>
        <div className="mt-4 space-y-3 rounded-lg border border-lp-border bg-lp-surface2 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-lp-text2">Min Rating</span>
            <span className="rounded-md border border-lp-border bg-lp-bg px-3 py-1 text-sm font-bold text-lp-text">
              4 Stars
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-md bg-lp-red/10 px-2 py-1 text-xs font-bold text-lp-red">Core Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}
