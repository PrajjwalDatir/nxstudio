"use client";

import { useRef, useState } from "react";
import { useWorkspace } from "@/lib/workspace-store";
import { useSpeechInput } from "@/lib/use-speech-input";
import { useCompiledPrompts } from "@/lib/use-compiled-prompts";
import { BrandDNA, IdeaData } from "@/lib/types";
import { PhaseHeader } from "./PhaseHeader";
import { CopyButton } from "./CopyButton";
import { PremiumDialog } from "@/components/billing/PremiumDialog";
import { PaperclipIcon, MicIcon, WandIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

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

/** True for files whose text we can inline into the answer. */
function isTextLike(file: File): boolean {
  return (
    file.type.startsWith("text/") ||
    /\.(txt|md|markdown|csv|json|ya?ml|log)$/i.test(file.name)
  );
}

function append(existing: string, addition: string): string {
  const a = addition.trim();
  if (!a) return existing;
  return existing.trim() ? `${existing.trim()}\n\n${a}` : a;
}

function QuestionCard({
  title,
  placeholder,
  value,
  onChange,
}: {
  title: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<string | null>(null);
  const { supported: voiceSupported, listening, toggle } = useSpeechInput((text) =>
    onChange(append(value, text))
  );

  const onFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    let next = value;
    const skipped: string[] = [];
    for (const file of Array.from(list)) {
      if (isTextLike(file)) {
        try {
          const text = await file.text();
          next = append(next, text);
        } catch {
          skipped.push(file.name);
        }
      } else {
        skipped.push(file.name);
      }
    }
    onChange(next);
    setNote(
      skipped.length
        ? `Couldn't inline ${skipped.join(", ")} — only text files can be added to the answer.`
        : null
    );
  };

  return (
    <div className="rounded-xl glass p-5">
      <label className="font-medium">{title}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="mt-3 w-full resize-none rounded-lg border border-border bg-secondary/30 p-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
      />
      <div className="mt-3 flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".txt,.md,.markdown,.csv,.json,.yaml,.yml,.log,text/*"
          className="hidden"
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <PaperclipIcon className="h-3.5 w-3.5" />
          Attach files
        </button>

        {voiceSupported && (
          <button
            type="button"
            onClick={toggle}
            aria-pressed={listening}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors",
              listening
                ? "bg-primary/15 text-primary"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            <MicIcon className="h-3.5 w-3.5" />
            {listening ? (
              <span className="flex items-center gap-1.5">
                Listening
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              </span>
            ) : (
              "Voice input"
            )}
          </button>
        )}
      </div>

      {note && <p className="mt-2 text-xs text-amber-400/80">{note}</p>}
    </div>
  );
}

const BRAND_FIELDS: {
  field: keyof BrandDNA;
  label: string;
  placeholder: string;
}[] = [
  { field: "vibe", label: "Vibe", placeholder: "e.g. minimal, playful, editorial" },
  { field: "primaryColor", label: "Primary color", placeholder: "e.g. #6366F1 or indigo" },
  { field: "radius", label: "Border radius", placeholder: "e.g. 0.75rem" },
  { field: "font", label: "Font", placeholder: "e.g. Inter" },
];

export function IdeaPhase() {
  const { data, updateIdea, updateBrand } = useWorkspace();
  const { prompts, locked, refresh } = useCompiledPrompts();
  const [payOpen, setPayOpen] = useState(false);

  const answered = QUESTIONS.filter((q) => data.idea[q.field].trim().length > 0).length;
  const percent = Math.round((answered / QUESTIONS.length) * 100);

  return (
    <>
      <PhaseHeader title="Brief" status="in-progress" phaseId="idea" showTeam />

      <PremiumDialog open={payOpen} onClose={() => setPayOpen(false)} onActivated={() => { setPayOpen(false); refresh(); }} />

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
          <QuestionCard
            key={q.field}
            title={q.title}
            placeholder={q.placeholder}
            value={data.idea[q.field]}
            onChange={(value) => updateIdea(q.field, value)}
          />
        ))}
      </div>

      {/* Brand DNA — locked into every generated prompt to prevent style drift */}
      <div className="mt-4 rounded-xl glass p-5">
        <label className="font-medium">Brand DNA</label>
        <p className="mt-1 text-sm text-muted-foreground">
          Locked into the build prompt so generated code stays visually consistent.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {BRAND_FIELDS.map((b) => (
            <label key={b.field} className="block">
              <span className="text-sm text-muted-foreground">{b.label}</span>
              <input
                value={data.brand[b.field]}
                onChange={(e) => updateBrand(b.field, e.target.value)}
                placeholder={b.placeholder}
                className="mt-1.5 w-full rounded-lg border border-border bg-secondary/30 p-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Prompt output */}
      <div className="mt-6 flex items-center gap-4 rounded-xl glass p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <WandIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium">Pressure-test this idea</div>
          <div className="truncate text-sm text-muted-foreground">
            Riskiest assumptions, who to interview, a sharpened problem statement
          </div>
        </div>
        {locked ? (
          <CopyButton value="" label="Unlock" variant="solid" locked onLockedClick={() => setPayOpen(true)} />
        ) : (
          <CopyButton value={prompts?.idea.prompt ?? ""} label="Copy" variant="solid" />
        )}
      </div>
    </>
  );
}
