"use client";

import { useState } from "react";
import { Post, PostCard } from "./PostCard";
import { GeneratePostModal } from "./GeneratePostModal";
import { Filter } from "lucide-react";

export function PostQueue({ 
  initialPosts, 
  reviews, 
  occasions,
  businessId
}: { 
  initialPosts: Post[];
  reviews: any[];
  occasions: any[];
  businessId?: string;
}) {
  const [filter, setFilter] = useState<"all" | "pending_approval" | "approved" | "published" | "draft">("all");

  const filteredPosts = initialPosts.filter(post => {
    if (filter === "all") return true;
    return post.status === filter;
  });

  const pendingCount = initialPosts.filter(p => p.status === "pending_approval").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-lp-border pb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          <Filter className="size-4 text-lp-text3 shrink-0" />
          <button
            onClick={() => setFilter("all")}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition ${filter === "all" ? "bg-lp-surface3 text-lp-text" : "text-lp-text2 hover:bg-lp-surface2"}`}
          >
            All Posts
          </button>
          <button
            onClick={() => setFilter("pending_approval")}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition flex items-center gap-2 ${filter === "pending_approval" ? "bg-lp-accent/20 text-lp-accent border border-lp-accent/20" : "text-lp-text2 hover:bg-lp-surface2"}`}
          >
            Pending {pendingCount > 0 && <span className="rounded-full bg-lp-accent px-1.5 py-0.5 text-[10px] text-lp-bg">{pendingCount}</span>}
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition ${filter === "approved" ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/20" : "text-lp-text2 hover:bg-lp-surface2"}`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter("published")}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition ${filter === "published" ? "bg-blue-500/20 text-blue-500 border border-blue-500/20" : "text-lp-text2 hover:bg-lp-surface2"}`}
          >
            Published
          </button>
          <button
            onClick={() => setFilter("draft")}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition ${filter === "draft" ? "bg-lp-surface3 text-lp-text" : "text-lp-text2 hover:bg-lp-surface2"}`}
          >
            Drafts
          </button>
        </div>
        
        <div className="shrink-0">
          <GeneratePostModal reviews={reviews} occasions={occasions} businessId={businessId} />
        </div>
      </div>

      <div className="space-y-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-lp-border2 p-12 text-center">
            <p className="font-heading text-lg font-bold text-lp-text">No posts found</p>
            <p className="mt-2 text-sm text-lp-text2">There are no posts matching this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
