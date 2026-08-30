"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Plus, Send, X } from "lucide-react";
import { inviteClient, type InviteClientState } from "@/app/(admin)/admin/clients/actions";

const initialState: InviteClientState = {
  ok: false,
  message: "",
};

const categories = ["Bakery", "Restaurant", "Salon", "Dental", "Retail", "Other"];

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-lp-accent px-4 text-sm font-bold text-lp-bg transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Send className="size-4" />
      {pending ? "Sending..." : "Send invite"}
    </button>
  );
}

export function AddClientModal() {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState(inviteClient, initialState);

  useEffect(() => {
    if (!state.message) {
      return;
    }

    if (state.ok) {
      setOpen(false);
      formRef.current?.reset();
      setToast(state.message);
      const timer = window.setTimeout(() => setToast(""), 4200);
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [state]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-lp-accent px-4 text-sm font-bold text-lp-bg transition hover:brightness-95"
      >
        <Plus className="size-4" />
        Add Client
      </button>

      {toast ? (
        <div className="fixed right-5 top-5 z-50 rounded-xl border border-lp-accent/30 bg-lp-surface px-4 py-3 text-sm font-medium text-lp-accent shadow-glow">
          {toast}
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-lp-border bg-lp-surface p-6 shadow-glow">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-heading text-2xl font-bold text-lp-text">Invite client</h2>
                <p className="mt-1 text-sm text-lp-text2">
                  Create the business and send a magic link invite.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg border border-lp-border bg-lp-surface2 text-lp-text2 transition hover:bg-lp-surface3 hover:text-lp-text"
                aria-label="Close modal"
              >
                <X className="size-4" />
              </button>
            </div>

            <form ref={formRef} action={formAction} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-lp-text2">Business name</span>
                  <input
                    name="businessName"
                    required
                    className="h-11 w-full rounded-lg border border-lp-border bg-lp-surface2 px-3 text-sm text-lp-text outline-none placeholder:text-lp-text3 focus:border-lp-border2"
                    placeholder="Kiran's Bakehouse"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-lp-text2">Owner email</span>
                  <input
                    name="email"
                    required
                    type="email"
                    className="h-11 w-full rounded-lg border border-lp-border bg-lp-surface2 px-3 text-sm text-lp-text outline-none placeholder:text-lp-text3 focus:border-lp-border2"
                    placeholder="owner@business.com"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-medium text-lp-text2">Location</span>
                  <input
                    name="location"
                    required
                    className="h-11 w-full rounded-lg border border-lp-border bg-lp-surface2 px-3 text-sm text-lp-text outline-none placeholder:text-lp-text3 focus:border-lp-border2"
                    placeholder="Bandra West, Mumbai"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-medium text-lp-text2">Business category</span>
                  <select
                    name="category"
                    className="h-11 w-full rounded-lg border border-lp-border bg-lp-surface2 px-3 text-sm text-lp-text outline-none focus:border-lp-border2"
                    defaultValue="Bakery"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-lp-text2">Plan</span>
                  <select
                    name="plan"
                    className="h-11 w-full rounded-lg border border-lp-border bg-lp-surface2 px-3 text-sm text-lp-text outline-none focus:border-lp-border2"
                    defaultValue="trial"
                  >
                    <option value="trial">Trial</option>
                    <option value="starter">Starter ₹799/mo</option>
                    <option value="growth">Growth ₹1,999/mo</option>
                    <option value="agency">Agency ₹4,999/mo</option>
                  </select>
                </label>
              </div>

              {state.message && !state.ok ? (
                <p className="rounded-lg border border-lp-red/30 bg-lp-red/10 px-3 py-2 text-sm text-lp-red">
                  {state.message}
                </p>
              ) : null}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-10 rounded-lg border border-lp-border bg-lp-surface2 px-4 text-sm font-medium text-lp-text2 transition hover:bg-lp-surface3 hover:text-lp-text"
                >
                  Cancel
                </button>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
