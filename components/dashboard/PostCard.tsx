"use client";

import { useState } from "react";
import { Check, Edit2, Trash2, X, MessageSquare, Calendar, PenTool, Sparkles, AlertCircle, Image as ImageIcon, FolderOpen, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export type Post = {
  id: string;
  content: string;
  source_type: "review" | "seasonal" | "manual" | "event" | "promo";
  status: "draft" | "pending_approval" | "approved" | "scheduled" | "published" | "failed";
  scheduled_at: string | null;
  published_at: string | null;
  failed_reason: string | null;
  image_url?: string | null;
  reviews?: {
    reviewer_name: string | null;
    rating: number | null;
  } | null;
};

export function PostCard({ post }: { post: Post }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [status, setStatus] = useState(post.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(post.image_url || null);
  const [showBrowser, setShowBrowser] = useState(false);
  const [browserImages, setBrowserImages] = useState<any[]>([]);
  const [loadingBrowser, setLoadingBrowser] = useState(false);

  const handleUpdateImage = async (newUrl: string | null) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/posts/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: post.id,
          action: "update-image",
          image_url: newUrl,
        }),
      });

      if (!res.ok) throw new Error("Failed to update image");

      setCurrentImageUrl(newUrl);
    } catch (error) {
      console.error(error);
      alert("Failed to update image");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openBrowser = async () => {
    setShowBrowser(true);
    setLoadingBrowser(true);
    try {
      const res = await fetch("/api/media");
      if (res.ok) {
        const data = await res.json();
        setBrowserImages(data.images || []);
      }
    } catch (err) {
      console.error("Failed to load library images", err);
    } finally {
      setLoadingBrowser(false);
    }
  };

  // Swipe gesture state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const minSwipeDistance = 100;

  const getSourceIcon = () => {
    switch (post.source_type) {
      case "review": return <MessageSquare className="size-4 text-emerald-500" />;
      case "seasonal": return <Calendar className="size-4 text-orange-500" />;
      case "manual": return <PenTool className="size-4 text-gray-400" />;
      default: return <Sparkles className="size-4 text-blue-500" />;
    }
  };

  const getSourceLabel = () => {
    switch (post.source_type) {
      case "review": return `From Review${post.reviews?.reviewer_name ? ` (${post.reviews.reviewer_name})` : ''}`;
      case "seasonal": return "Seasonal Content";
      case "manual": return "Manual Post";
      default: return "Generated Post";
    }
  };
  
  const getDotColor = () => {
    switch (post.source_type) {
      case "review": return "bg-emerald-500";
      case "seasonal": return "bg-orange-500";
      case "manual": return "bg-gray-400";
      default: return "bg-blue-500";
    }
  };

  const handleAction = async (action: "approve" | "reject" | "edit", content?: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/posts/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: post.id,
          action,
          edited_content: content,
          image_url: currentImageUrl,
        }),
      });

      if (!res.ok) throw new Error("Failed to process action");

      if (action === "approve" || action === "edit") {
        setStatus("approved");
      } else if (action === "reject") {
        setStatus("draft");
      }
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setIsSubmitting(false);
      setSwipeOffset(0);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/posts?post_id=${post.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to delete post");
      setIsSubmitting(false);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (status !== "pending_approval" || isEditing || isSubmitting) return;
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (status !== "pending_approval" || isEditing || touchStart === null || isSubmitting) return;
    const currentTouch = e.targetTouches[0].clientX;
    const offset = currentTouch - touchStart;
    
    // Limit maximum swipe distance visually
    if (offset > 150) setSwipeOffset(150);
    else if (offset < -150) setSwipeOffset(-150);
    else setSwipeOffset(offset);
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (status !== "pending_approval" || isEditing || touchStart === null || isSubmitting) return;
    
    const end = e.changedTouches[0].clientX;
    const distance = end - touchStart;
    
    if (distance > minSwipeDistance) {
      handleAction("approve");
    } else if (distance < -minSwipeDistance) {
      handleAction("reject");
    } else {
      // Snap back if didn't reach threshold
      setSwipeOffset(0);
    }
    
    setTouchStart(null);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-lp-border bg-lp-surface transition hover:border-lp-border2">
      {/* Background actions for swipe */}
      {status === "pending_approval" && !isEditing && (
        <div className="absolute inset-0 z-0 flex items-center justify-between px-6 bg-lp-surface2">
          <div className={`flex items-center gap-2 font-bold transition-opacity duration-200 ${swipeOffset > 50 ? "opacity-100 text-emerald-500" : "opacity-0 text-lp-text3"}`}>
            <Check className="size-6" /> Approve
          </div>
          <div className={`flex items-center gap-2 font-bold transition-opacity duration-200 ${swipeOffset < -50 ? "opacity-100 text-lp-red" : "opacity-0 text-lp-text3"}`}>
            Reject <X className="size-6" />
          </div>
        </div>
      )}

      {/* Main card content */}
      <div 
        className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-lp-surface p-5 h-full transition-transform duration-200"
        style={{ transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : 'none' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className={`absolute left-0 top-0 h-full w-1 ${getDotColor()}`} />
        
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full border border-lp-border bg-lp-bg px-2.5 py-1 text-xs font-bold text-lp-text2">
              {getSourceIcon()}
              {getSourceLabel()}
            </span>
            
            {status === "pending_approval" && (
              <span className="rounded-full border border-lp-accent/20 bg-lp-accent/10 px-2.5 py-1 text-xs font-bold text-lp-accent">
                Pending Approval
              </span>
            )}
            {status === "draft" && (
              <span className="rounded-full border border-lp-text3/20 bg-lp-text3/10 px-2.5 py-1 text-xs font-bold text-lp-text3">
                Draft
              </span>
            )}
            {status === "approved" && (
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-500">
                Approved (Scheduled)
              </span>
            )}
            {status === "published" && (
              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-500">
                Published
              </span>
            )}
            {status === "failed" && (
              <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-500 flex items-center gap-1">
                <AlertCircle className="size-3" /> Failed
              </span>
            )}
          </div>

          {isEditing ? (
            <textarea
              className="w-full min-h-[120px] rounded-lg border border-lp-border bg-lp-bg p-3 text-sm text-lp-text focus:border-lp-accent focus:outline-none focus:ring-1 focus:ring-lp-accent"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              disabled={isSubmitting}
            />
          ) : (
            <p className="text-sm leading-6 text-lp-text whitespace-pre-wrap">{editedContent}</p>
          )}

          {/* Image Selection Area */}
          {(status === "pending_approval" || isEditing) ? (
            <div className="mt-4 border border-lp-border bg-lp-bg/20 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-lp-text3">
                Post Image
              </p>
              
              {currentImageUrl ? (
                <div className="space-y-3">
                  <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-lp-border bg-lp-surface2">
                    <img 
                      src={currentImageUrl} 
                      alt="Suggested post asset" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateImage(currentImageUrl)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lp-accent/10 border border-lp-accent/20 px-3 text-xs font-bold text-lp-accent hover:bg-lp-accent/20 transition"
                    >
                      <Check className="size-3" /> Use this
                    </button>
                    <button
                      type="button"
                      onClick={openBrowser}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-lp-border bg-lp-surface2 px-3 text-xs font-bold text-lp-text2 hover:bg-lp-surface3 transition"
                    >
                      <FolderOpen className="size-3" /> Choose different
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateImage(null)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-lp-border bg-lp-surface2 px-3 text-xs font-bold text-lp-red/80 hover:bg-lp-red/10 transition"
                    >
                      <X className="size-3" /> No image
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex size-14 items-center justify-center rounded-lg border border-dashed border-lp-border bg-lp-bg/40 text-lp-text3">
                    <ImageIcon className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-lp-text2">No image attached</p>
                    <button
                      type="button"
                      onClick={openBrowser}
                      className="mt-1 inline-flex h-7 items-center gap-1 rounded-lg border border-lp-border bg-lp-surface2 px-2.5 text-[11px] font-bold text-lp-accent hover:bg-lp-surface3 transition"
                    >
                      Browse library
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            currentImageUrl && (
              <div className="mt-4 flex items-center gap-3">
                <div className="w-24 h-14 rounded-lg overflow-hidden border border-lp-border bg-lp-surface2">
                  <img 
                    src={currentImageUrl} 
                    alt="Attached media" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-lp-text3">Attached Image</p>
                  <p className="text-[10px] text-lp-text2 truncate max-w-xs">{currentImageUrl}</p>
                </div>
              </div>
            )
          )}
          
          {post.failed_reason && status === "failed" && (
            <p className="text-xs text-red-400 mt-2">Error: {post.failed_reason}</p>
          )}

          {/* Browse Library Modal */}
          {showBrowser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
              <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-lp-border bg-lp-surface p-6 shadow-glow space-y-4">
                <div className="flex items-center justify-between border-b border-lp-border pb-3">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-lp-text">Select Image</h3>
                    <p className="text-xs text-lp-text2">Choose a photo from your business media library.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBrowser(false)}
                    className="flex size-8 items-center justify-center rounded-lg border border-lp-border text-lp-text2 hover:bg-lp-surface2 hover:text-lp-text"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {loadingBrowser ? (
                  <div className="flex flex-col items-center justify-center py-12 text-lp-text2">
                    <Loader2 className="size-8 animate-spin text-lp-accent mb-2" />
                    <p className="text-sm">Loading media library...</p>
                  </div>
                ) : browserImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {browserImages.map((img) => (
                      <div
                        key={img.id}
                        onClick={() => {
                          handleUpdateImage(img.url);
                          setShowBrowser(false);
                        }}
                        className="group relative rounded-lg border border-lp-border overflow-hidden aspect-[4/3] cursor-pointer hover:border-lp-accent transition"
                      >
                        <img
                          src={img.url}
                          alt={img.label || img.category}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <span className="bg-lp-accent text-lp-bg text-xs font-bold px-3 py-1.5 rounded-lg shadow">
                            Select Photo
                          </span>
                        </div>
                        <div className="absolute bottom-2 left-2 flex gap-1">
                          {img.label && (
                            <span className="px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-white text-[9px] font-bold">
                              {img.label}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-lp-text2">
                    <p className="text-sm font-bold text-lp-text">No library images found</p>
                    <p className="text-xs mt-1">Upload images first in Settings &gt; Business Profile &gt; Media Library.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex sm:flex-col gap-2 shrink-0">
          {(status === "pending_approval" || status === "draft") && !isEditing && (
            <>
              <button
                onClick={() => handleAction("approve")}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-lp-accent px-3 py-2 text-sm font-bold text-lp-bg hover:bg-lp-accent/90 disabled:opacity-50"
              >
                <Check className="size-4" /> Approve
              </button>
              <button
                onClick={() => setIsEditing(true)}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg border border-lp-border bg-transparent px-3 py-2 text-sm font-bold text-lp-text hover:bg-lp-surface2 disabled:opacity-50"
              >
                <Edit2 className="size-4" /> Edit
              </button>
            </>
          )}
          
          {isEditing && (
            <>
              <button
                onClick={() => handleAction("edit", editedContent)}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-lp-accent px-3 py-2 text-sm font-bold text-lp-bg hover:bg-lp-accent/90 disabled:opacity-50"
              >
                <Check className="size-4" /> Save & Approve
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(post.content);
                }}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg border border-lp-border bg-transparent px-3 py-2 text-sm font-bold text-lp-text hover:bg-lp-surface2 disabled:opacity-50"
              >
                <X className="size-4" /> Cancel
              </button>
            </>
          )}

          {!isEditing && (status === "draft" || status === "pending_approval" || status === "failed") && (
            <button
              onClick={handleDelete}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg border border-lp-border bg-transparent px-3 py-2 text-sm font-bold text-lp-text hover:bg-lp-red/10 hover:text-lp-red hover:border-lp-red/20 disabled:opacity-50"
            >
              <Trash2 className="size-4" /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
