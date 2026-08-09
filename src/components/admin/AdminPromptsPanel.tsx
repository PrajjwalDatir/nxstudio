"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, LockIcon, LoaderIcon } from "@/components/icons";

interface PromptTemplateRow {
  id: string;
  title: string;
  description: string;
  body: string;
  category?: string;
  status: "pending" | "approved" | "rejected";
  submitted_by?: string;
  sort: number;
}

export function AdminPromptsPanel() {
  const [templates, setTemplates] = useState<PromptTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchPrompts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/prompts");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch prompts.");
      setTemplates(data.templates ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admin prompts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const updateStatus = async (id: string, newStatus: "approved" | "rejected" | "pending") => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/prompts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update status.");
      
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = templates.filter((t) => (t.status ?? "approved") === activeTab);

  if (error) return null; // Hide panel if user isn't admin (403 Forbidden)

  return (
    <section className="mt-8 rounded-xl border border-primary/30 bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-accent-foreground">
            <LockIcon className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold">Admin Prompt Pipeline (/expert)</h2>
            <p className="text-xs text-muted-foreground">
              Review and approve expert community-submitted prompts across the platform.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-accent-foreground uppercase">
          Admin Only
        </span>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex items-center gap-2 border-b border-border pb-3">
        {(["pending", "approved", "rejected"] as const).map((tab) => {
          const count = templates.filter((t) => (t.status ?? "approved") === tab).length;
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {tab}
              <span className="rounded-full bg-background/20 px-1.5 py-0.2 text-[10px]">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground justify-center">
            <LoaderIcon className="h-4 w-4 animate-spin" /> Loading admin prompts...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No {activeTab} prompts in pipeline.
          </div>
        ) : (
          filtered.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{t.title}</span>
                    <span className="rounded-md border border-border bg-secondary px-2 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                      {t.category ?? "general"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                  {t.submitted_by && (
                    <p className="mt-1 font-mono text-[11px] text-accent-foreground/80">
                      Submitted by: {t.submitted_by}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {t.status !== "approved" && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(t.id, "approved")}
                      disabled={updatingId === t.id}
                      className="h-8 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircleIcon className="h-3.5 w-3.5" /> Approve
                    </Button>
                  )}
                  {t.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(t.id, "rejected")}
                      disabled={updatingId === t.id}
                      className="h-8 text-xs border-red-500/40 text-red-400 hover:bg-red-500/10"
                    >
                      Reject
                    </Button>
                  )}
                </div>
              </div>

              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  View template body
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-border bg-secondary/30 p-3 font-mono text-[11px] text-muted-foreground whitespace-pre-wrap">
                  {t.body}
                </pre>
              </details>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
