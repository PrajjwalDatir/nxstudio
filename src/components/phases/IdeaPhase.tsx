"use client";

import { useWorkspace } from "@/lib/workspace-store";
import { IdeaData } from "@/lib/types";
import { buildIdeaPrompt } from "@/lib/prompts";
import { PhaseHeader } from "./PhaseHeader";
import { CopyButton } from "./CopyButton";
import { PaperclipIcon, MicIcon, WandIcon } from "@/components/icons";

const QUESTIONS: {
  field: keyof IdeaData;
  title: string;
  placeholder: string;
}[] = [
  {
    field: "problem",
    title: "What problem are you solving?",
    placeholder: "Describe the main pain point you've identified. Why does this need to be fixed now?",
  },
  {
    field: "targetUsers",
    title: "Who are your target users?",
    placeholder: "Define your ideal customer persona. Who experiences this problem most acutely?",
  },
  {
    field: "currentSolutions",
    title: "How do they solve it today?",
    placeholder: "List current alternatives, manual workarounds, or competitor products they use.",
  },
  {
    field: "differentiation",
    title: "What makes you different?",
    placeholder: "Why will your approach win? What's the unfair advantage or key insight?",
  },
];

export function IdeaPhase() {
  const { data, updateIdea } = useWorkspace();

  const answered = QUESTIONS.filter((q) => data.idea[q.field].trim().length > 0).length;
  const percent = Math.round((answered / QUESTIONS.length) * 100);

  return (
    <>
      <PhaseHeader title="Ideation" status="in-progress" meta="Due Oct 24" showTeam />

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Tell us about your idea</h2>
          <span className="text-sm font-medium text-primary">
            {answered} / {QUESTIONS.length}
          </span>
        </div>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {QUESTIONS.map((q) => (
          <div key={q.field} className="rounded-xl border border-border bg-card p-5">
            <label className="font-medium">{q.title}</label>
            <textarea
              value={data.idea[q.field]}
              onChange={(e) => updateIdea(q.field, e.target.value)}
              placeholder={q.placeholder}
              rows={3}
              className="mt-3 w-full resize-none rounded-lg border border-border bg-secondary/30 p-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
            />
            <div className="mt-3 flex gap-2">
              <button className="inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
                <PaperclipIcon className="h-3.5 w-3.5" />
                Attach files
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
                <MicIcon className="h-3.5 w-3.5" />
                Voice input
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Prompt output */}
      <div className="mt-6 flex items-center gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <WandIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium">Pressure-test this idea</div>
          <div className="truncate text-sm text-muted-foreground">
            Riskiest assumptions, who to interview, a sharpened problem statement
          </div>
        </div>
        <CopyButton value={buildIdeaPrompt(data)} label="Copy" variant="solid" />
      </div>
    </>
  );
}
