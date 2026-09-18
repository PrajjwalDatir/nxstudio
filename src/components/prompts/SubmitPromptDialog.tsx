"use client";

import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, LoaderIcon, CheckCircleIcon, WandIcon, XIcon } from "@/components/icons";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SubmitPromptDialog({ open, onClose }: Props) {
  const idPrefix = useId();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("visual");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !body.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/prompts/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          description: description.trim(),
          body: body.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit prompt.");

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setTitle("");
        setDescription("");
        setBody("");
        onClose();
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit prompt.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-accent-foreground">
              <WandIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Submit Expert Prompt</h2>
              <p className="text-xs text-muted-foreground">Contribute a refinement prompt for community review</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="my-8 flex flex-col items-center justify-center text-center">
            <CheckCircleIcon className="h-10 w-10 text-emerald-500 animate-bounce" />
            <h3 className="mt-3 text-base font-semibold">Prompt Submitted!</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs">
              Your prompt has been queued for admin review. Once approved, it will be published to all founders.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {error && <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">{error}</p>}

            <div>
              <label htmlFor={`${idPrefix}-title`} className="block text-xs font-medium text-muted-foreground mb-1">
                Prompt Title
              </label>
              <input
                id={`${idPrefix}-title`}
                type="text"
                required
                placeholder="e.g. Apple Watch HIG Audit"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`${idPrefix}-category`} className="block text-xs font-medium text-muted-foreground mb-1">
                  Category
                </label>
                <select
                  id={`${idPrefix}-category`}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="visual">Visual & HIG</option>
                  <option value="security">Security</option>
                  <option value="qa">QA & Testing</option>
                  <option value="performance">Performance</option>
                  <option value="deploy">Deploy & Ops</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label htmlFor={`${idPrefix}-description`} className="block text-xs font-medium text-muted-foreground mb-1">
                  Short Description
                </label>
                <input
                  id={`${idPrefix}-description`}
                  type="text"
                  required
                  placeholder="e.g. Audit touch bounds & motion"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor={`${idPrefix}-body`} className="block text-xs font-medium text-muted-foreground">
                  Prompt Prose Body
                </label>
                <span className="font-mono text-[10px] text-accent-foreground">Tokens: {"{{name}}"}, {"{{ctx}}"}, {"{{fe}}"}</span>
              </div>
              <textarea
                id={`${idPrefix}-body`}
                required
                rows={5}
                placeholder={`{{ctx}}\n\nAct as a security auditor for "{{name}}". Audit auth handling, RLS policies, and secret leakage...`}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full rounded-lg border border-border bg-background p-3 font-mono text-xs outline-none focus:border-primary leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !title || !body} className="gap-2">
                {submitting ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <PlusIcon className="h-4 w-4" />}
                Submit for Review
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
