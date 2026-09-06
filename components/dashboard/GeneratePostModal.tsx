"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, Send, Sparkles, X, Save, Image as ImageIcon, FolderOpen } from "lucide-react";

export type ReviewOption = {
  id: string;
  reviewer_name: string | null;
  rating: number | null;
  review_text: string | null;
};

export type OccasionOption = {
  name: string;
  date: string;
  daysUntil: number;
};

type SourceType = "review" | "seasonal" | "manual";

const tones = ["Warm & Friendly", "Professional", "Playful", "Urgent", "Local language / Hinglish"];

export function GeneratePostModal({
  reviews,
  occasions,
  triggerLabel = "Generate post",
  businessId,
  singleReview,
}: {
  reviews: ReviewOption[];
  occasions: OccasionOption[];
  triggerLabel?: string;
  businessId?: string;
  singleReview?: ReviewOption;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sourceType, setSourceType] = useState<SourceType>("review");
  const [reviewId, setReviewId] = useState(singleReview ? singleReview.id : reviews[0]?.id ?? "");
  const [occasionName, setOccasionName] = useState(occasions[0]?.name ?? "");
  const [manualContext, setManualContext] = useState("");
  const [tone, setTone] = useState(tones[0]);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<{ id: string; content: string; image_url?: string | null } | null>(null);
  const [previewContent, setPreviewContent] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showBrowser, setShowBrowser] = useState(false);
  const [browserImages, setBrowserImages] = useState<any[]>([]);
  const [loadingBrowser, setLoadingBrowser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

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

  const selectedReview = useMemo(
    () => singleReview || reviews.find((review) => review.id === reviewId) || reviews[0],
    [singleReview, reviewId, reviews],
  );
  const selectedOccasion = useMemo(
    () => occasions.find((occasion) => occasion.name === occasionName) ?? occasions[0],
    [occasionName, occasions],
  );

  async function generatePost() {
    setMessage("");
    const existingPostId = preview?.id;
    setPreview(null);
    setIsLoading(true);

    try {
      const payload =
        sourceType === "review"
          ? { source_type: sourceType, review_id: selectedReview?.id, tone, business_id: businessId, existing_post_id: existingPostId }
          : sourceType === "seasonal"
            ? {
                source_type: sourceType,
                occasion_name: selectedOccasion?.name,
                occasion_date: selectedOccasion?.date,
                tone,
                business_id: businessId,
                existing_post_id: existingPostId
              }
            : { source_type: sourceType, context: manualContext, tone, business_id: businessId, existing_post_id: existingPostId };

      const response = await fetch("/api/posts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Generation failed. Try again.");
        return;
      }

      setPreview({ id: data.post.id, content: data.post.content, image_url: data.post.image_url });
      setPreviewContent(data.post.content);
      setPreviewImage(data.post.image_url || null);
      setMessage("Post generated and saved for approval.");
      startTransition(() => router.refresh());
    } finally {
      setIsLoading(false);
    }
  }

  async function approveNow() {
    if (!preview) return;

    const response = await fetch("/api/posts/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        post_id: preview.id,
        action: previewContent === preview.content ? "approve" : "edit",
        edited_content: previewContent,
        image_url: previewImage,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Approval failed.");
      return;
    }

    setMessage("Post approved and scheduled! 🎉");
    startTransition(() => router.refresh());
    
    // Close the modal after a brief delay so they see the success message
    setTimeout(() => {
      setOpen(false);
      setPreview(null);
      setMessage("");
    }, 2000);
  }

  async function saveAsDraft() {
    if (!preview) return;

    const response = await fetch("/api/posts/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        post_id: preview.id,
        action: "draft",
        edited_content: previewContent,
        image_url: previewImage,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Save as draft failed.");
      return;
    }

    setMessage("Post saved as a draft!");
    startTransition(() => router.refresh());
    
    setTimeout(() => {
      setOpen(false);
      setPreview(null);
      setMessage("");
    }, 2000);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-lp-accent px-4 text-sm font-bold text-lp-bg transition hover:brightness-95"
      >
        <Sparkles className="size-4" />
        {triggerLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 sm:items-center">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-lp-border bg-lp-surface shadow-glow">
            <div className="flex items-center justify-between border-b border-lp-border p-5">
              <div>
                <h2 className="font-heading text-2xl font-bold text-lp-text">Generate Post</h2>
                <p className="mt-1 text-sm text-lp-text2">Create a review, seasonal, or manual GBP post.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-9 items-center justify-center rounded-lg border border-lp-border text-lp-text2 hover:bg-lp-surface2 hover:text-lp-text"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {!singleReview && (
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-lp-text3">
                    Source
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    <button
                      onClick={() => setSourceType("review")}
                      className={`rounded-lg border py-2 px-1 text-xs sm:text-sm font-bold transition text-center ${
                        sourceType === "review"
                          ? "border-lp-accent bg-lp-accent/10 text-lp-accent"
                          : "border-lp-border bg-lp-surface hover:bg-lp-surface2 text-lp-text2"
                      }`}
                    >
                      <span className="hidden sm:inline">Customer </span>Review
                    </button>
                    <button
                      onClick={() => setSourceType("seasonal")}
                      className={`rounded-lg border py-2 px-1 text-xs sm:text-sm font-bold transition text-center ${
                        sourceType === "seasonal"
                          ? "border-lp-accent bg-lp-accent/10 text-lp-accent"
                          : "border-lp-border bg-lp-surface hover:bg-lp-surface2 text-lp-text2"
                      }`}
                    >
                      <span className="hidden sm:inline">Seasonal </span>Event
                    </button>
                    <button
                      onClick={() => setSourceType("manual")}
                      className={`rounded-lg border py-2 px-1 text-xs sm:text-sm font-bold transition text-center ${
                        sourceType === "manual"
                          ? "border-lp-accent bg-lp-accent/10 text-lp-accent"
                          : "border-lp-border bg-lp-surface hover:bg-lp-surface2 text-lp-text2"
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                </div>
              )}

              {sourceType === "review" && (
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-lp-text3">
                    Select Review
                  </label>
                  {singleReview ? (
                    <div className="w-full rounded-xl border border-lp-border bg-lp-surface2 px-4 py-3 text-sm text-lp-text">
                      "{singleReview.review_text?.slice(0, 100)}..." - {singleReview.reviewer_name}
                    </div>
                  ) : reviews.length ? (
                    <>
                      <select
                        value={selectedReview?.id ?? ""}
                        onChange={(event) => setReviewId(event.target.value)}
                        className="h-10 w-full rounded-lg border border-lp-border bg-lp-surface2 px-3 text-sm text-lp-text outline-none"
                      >
                        {reviews.map((review) => (
                          <option key={review.id} value={review.id}>
                            {review.reviewer_name ?? "Anonymous"} - {review.rating ?? 0} stars
                          </option>
                        ))}
                      </select>
                      <div className="rounded-lg border border-lp-border bg-lp-bg/40 p-4 text-sm leading-6 text-lp-text2">
                        {selectedReview?.review_text}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-lg border border-lp-accent3/20 bg-lp-accent3/10 p-4 text-sm text-lp-accent3">
                      No unprocessed reviews found. Sync reviews first or choose Manual.
                    </div>
                  )}
                </div>
              )}

              {sourceType === "seasonal" ? (
                <select
                  value={selectedOccasion?.name ?? ""}
                  onChange={(event) => setOccasionName(event.target.value)}
                  className="h-10 w-full rounded-lg border border-lp-border bg-lp-surface2 px-3 text-sm text-lp-text outline-none"
                >
                  {occasions.map((occasion) => (
                    <option key={occasion.name} value={occasion.name}>
                      {occasion.name} - in {occasion.daysUntil} days
                    </option>
                  ))}
                </select>
              ) : null}

              {sourceType === "manual" ? (
                <textarea
                  value={manualContext}
                  onChange={(event) => setManualContext(event.target.value)}
                  placeholder="e.g. Mention our weekend brunch deal..."
                  className="min-h-28 w-full rounded-lg border border-lp-border bg-lp-surface2 p-3 text-sm leading-6 text-lp-text outline-none placeholder:text-lp-text3"
                />
              ) : null}

              <div className="grid gap-2 sm:grid-cols-4">
                {tones.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setTone(option)}
                    className={`h-9 rounded-lg px-2 text-sm font-bold ${
                      tone === option
                        ? "bg-lp-accent2 text-lp-bg"
                        : "border border-lp-border bg-lp-surface2 text-lp-text2 hover:bg-lp-surface3"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {message ? (
                <div className="rounded-lg border border-lp-border bg-lp-bg/40 p-3 text-sm text-lp-text2">{message}</div>
              ) : null}

              {preview ? (
                <div className="rounded-xl border border-lp-border bg-lp-bg/40 p-4">
                  <textarea
                    value={previewContent}
                    onChange={(event) => setPreviewContent(event.target.value)}
                    className="min-h-40 w-full resize-y bg-transparent text-sm leading-6 text-lp-text outline-none"
                  />

                  {/* Image Attachment Preview */}
                  <div className="mt-4 border border-lp-border bg-lp-bg/20 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-lp-text3">
                      Post Image
                    </p>
                    
                    {previewImage ? (
                      <div className="space-y-3">
                        <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-lp-border bg-lp-surface2">
                          <img 
                            src={previewImage} 
                            alt="Suggested post asset" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewImage(preview.image_url || null)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lp-accent/10 border border-lp-accent/20 px-3 text-xs font-bold text-lp-accent hover:bg-lp-accent/20 transition"
                          >
                            <Check className="size-3" /> Keep Suggestion
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
                            onClick={() => setPreviewImage(null)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-lp-border bg-lp-surface2 px-3 text-xs font-bold text-lp-red/80 hover:bg-lp-red/10 transition"
                          >
                            <X className="size-3" /> Remove image
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

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={approveNow}
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-lp-accent px-3 text-sm font-bold text-lp-bg"
                    >
                      <Check className="size-4" />
                      Approve Now
                    </button>
                    <button
                      type="button"
                      onClick={saveAsDraft}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-lp-border bg-lp-surface2 px-3 text-sm font-bold text-lp-text2 hover:bg-lp-surface3"
                    >
                      <Save className="size-4" />
                      Save as Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => setMessage("Edit the preview text, then approve when ready.")}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-lp-border bg-lp-surface2 px-3 text-sm font-bold text-lp-text2 hover:bg-lp-surface3"
                    >
                      <Pencil className="size-4" />
                      Edit
                    </button>
                  </div>
                </div>
              ) : null}

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
                              setPreviewImage(img.url);
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

              <button
                type="button"
                onClick={generatePost}
                disabled={isLoading || (sourceType === "review" && !reviews.length)}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-lp-accent px-4 text-sm font-bold text-lp-bg transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {isLoading ? "Writing your post..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
