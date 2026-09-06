"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, MessageSquarePlus, Sparkles, X, Pencil, Send, Copy, Save } from "lucide-react";

export type ReviewOption = {
  id: string;
  reviewer_name: string | null;
  rating: number | null;
  review_text: string | null;
  business_id?: string;
  draft_reply_text?: string | null;
  draft_reply_status?: string | null;
};

const tones = [
  { id: "professional", label: "Professional" },
  { id: "warm_friendly", label: "Warm & Friendly" },
  { id: "apologetic", label: "Apologetic & Caring" },
  { id: "funny", label: "Funny & Witty" },
  { id: "hinglish", label: "Local language / Hinglish" }
];

export function GenerateReplyModal({
  review,
  businessId,
}: {
  review: ReviewOption;
  businessId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState(tones[0].id);
  const [message, setMessage] = useState("");
  const [previewContent, setPreviewContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editedContent, setEditedContent] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Load existing draft if available
  const hasDraft = !!review.draft_reply_text;
  
  async function generateReply() {
    setMessage("");
    setPreviewContent("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/reviews/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_id: review.id, tone, business_id: businessId }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Generation failed. Try again.");
        return;
      }

      setPreviewContent(data.reply);
      setMessage("Reply drafted successfully.");
      startTransition(() => router.refresh());
    } finally {
      setIsLoading(false);
    }
  }

  async function approveNow() {
    if (!previewContent && !review.draft_reply_text) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/reviews/generate-reply", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          review_id: review.id, 
          action: "publish",
          content: previewContent || review.draft_reply_text
        }),
      });
      
      if (!response.ok) {
        setMessage("Publishing failed. Try again.");
        return;
      }
      
      setMessage("Reply published to Google!");
      startTransition(() => {
        router.refresh();
        setOpen(false);
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function saveDraft() {
    if (!activeContent) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/reviews/generate-reply", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          review_id: review.id, 
          action: "save_draft",
          content: activeContent
        }),
      });
      
      if (!response.ok) {
        setMessage("Saving failed. Try again.");
        return;
      }
      
      setMessage("Draft saved successfully!");
      startTransition(() => {
        router.refresh();
        setOpen(false);
      });
    } finally {
      setIsLoading(false);
    }
  }

  const activeContent = editedContent !== null ? editedContent : (previewContent || review.draft_reply_text);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-lp-border bg-lp-surface2 px-3 text-sm font-bold text-lp-text2 transition hover:bg-lp-surface3 hover:text-lp-text"
      >
        <MessageSquarePlus className="size-4" />
        Draft Reply
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex max-h-[100vh] sm:max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-lp-border bg-lp-surface shadow-2xl">
            <div className="flex-none flex items-center justify-between border-b border-lp-border p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-lp-accent2/10 text-lp-accent2">
                  <MessageSquarePlus className="size-5" />
                </div>
                <h3 className="font-bold text-lp-text">Draft AI Reply</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-lp-text3 hover:bg-lp-surface2 hover:text-lp-text transition"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-6">
                
                <div className="rounded-xl border border-lp-border bg-lp-surface2 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-lp-text3">Customer Review</p>
                  <p className="mt-2 text-sm text-lp-text">
                    "{review.review_text?.slice(0, 150)}..." - {review.reviewer_name}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-lp-text3">
                    Reply Tone
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tones.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTone(t.id)}
                        className={`h-9 rounded-lg px-3 text-sm font-bold ${
                          tone === t.id
                            ? "bg-lp-accent2 text-lp-bg"
                            : "border border-lp-border bg-lp-surface2 text-lp-text2 hover:bg-lp-surface3"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {message && (
                  <p className={`text-sm font-bold ${message.includes("failed") ? "text-lp-red" : "text-lp-accent2"}`}>
                    {message}
                  </p>
                )}

                {activeContent && (
                  <div className="rounded-xl border border-lp-accent2/30 bg-lp-accent2/5 p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-widest text-lp-accent2">
                        Drafted Reply
                      </p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(activeContent || "");
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className={`flex items-center gap-1 text-xs font-bold transition ${copied ? "text-lp-accent2" : "text-lp-text3 hover:text-lp-text"}`}
                          title="Copy Reply"
                        >
                          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                          {copied && <span>Copied</span>}
                        </button>
                        <button 
                          onClick={() => setIsEditing(!isEditing)} 
                          className={`text-lp-text3 hover:text-lp-text transition ${isEditing ? "text-lp-accent2" : ""}`}
                          title={isEditing ? "Done Editing" : "Edit Reply"}
                        >
                          <Pencil className="size-4" />
                        </button>
                      </div>
                    </div>
                    {isEditing ? (
                      <textarea
                        value={activeContent || ""}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="mt-3 w-full min-h-[120px] resize-none rounded-lg border border-lp-border bg-lp-surface p-3 text-sm leading-6 text-lp-text outline-none focus:border-lp-accent2 transition"
                      />
                    ) : (
                      <p className="mt-3 text-sm leading-6 text-lp-text">{activeContent}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-none flex items-center justify-end gap-3 border-t border-lp-border bg-lp-surface2 p-5">
              <button
                onClick={() => setOpen(false)}
                className="h-10 rounded-lg px-4 text-sm font-bold text-lp-text2 hover:text-lp-text transition"
              >
                Cancel
              </button>
              
              {activeContent ? (
                <>
                  <button
                    onClick={saveDraft}
                    disabled={isLoading || isPending}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg border border-lp-border bg-lp-surface px-4 text-sm font-bold text-lp-text transition hover:bg-lp-surface3 disabled:opacity-50"
                  >
                    <Save className="size-4" />
                    Save Draft
                  </button>
                  <button
                    onClick={generateReply}
                    disabled={isLoading}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg border border-lp-border bg-lp-surface px-4 text-sm font-bold text-lp-text transition hover:bg-lp-surface3 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    Regenerate
                  </button>
                  <button
                    onClick={approveNow}
                    disabled={isLoading || isPending}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg bg-lp-accent2 px-5 text-sm font-bold text-lp-bg transition hover:opacity-90 disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                    Approve & Publish
                  </button>
                </>
              ) : (
                <button
                  onClick={generateReply}
                  disabled={isLoading}
                  className="flex h-10 items-center justify-center gap-2 rounded-lg bg-lp-accent2 px-5 text-sm font-bold text-lp-bg transition hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  Generate Reply
                </button>
              )}
            </div>

            {/* Google Link */}
            {activeContent && (
              <div className="flex-none border-t border-lp-border bg-lp-bg p-3 text-center">
                <a 
                  href="https://business.google.com/reviews" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-lp-text3 hover:text-lp-accent2 transition"
                >
                  Paste this reply directly → <span className="underline">Open in Google</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
