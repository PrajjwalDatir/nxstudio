"use client";

import { useRef, useState, useId } from "react";
import { useWorkspace } from "@/lib/workspace-store";
import { useSpeechInput } from "@/lib/use-speech-input";
import { useCompiledPrompts } from "@/lib/use-compiled-prompts";
import { compileStack } from "@/lib/platform-engine";
import { IdeaData } from "@/lib/types";
import type { BriefAnalysisResult } from "@/app/api/context/analyze-brief/route";
import { EXAMPLE_BRIEFS, type ExampleBrief } from "@/lib/example-briefs";
import { PhaseHeader } from "./PhaseHeader";
import { CopyButton } from "./CopyButton";
import { TechStackPhase } from "./TechStackPhase";
import Link from "next/link";
import {
  PaperclipIcon,
  MicIcon,
  WandIcon,
  ChevronRightIcon,
  SparklesIcon,
  LoaderIcon,
  AlertTriangleIcon,
} from "@/components/icons";
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
  const id = useId();
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
      <label htmlFor={id} className="font-medium">{title}</label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={title}
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
                ? "bg-primary/15 text-accent-foreground"
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

// Brand vocabulary shared 1:1 with Studio's Design panel (see studio/schema.ts)
// so the two edit the same brand with the same options.
const VIBES = ["minimal", "playful", "bold", "elegant"] as const;
const FONTS = ["Inter", "Geist", "System UI", "Serif", "Monospace"] as const;
const HEX6 = /^#[0-9a-fA-F]{6}$/;

/** Parse the stored radius ("10px" or legacy "0.75rem") to a px number. */
function radiusToNum(raw: string): number {
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return 10;
  return raw.includes("rem") ? Math.round(n * 16) : Math.round(n);
}

type AnalysisState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; result: BriefAnalysisResult };

const VERDICT_STYLE: Record<BriefAnalysisResult["verdict"], string> = {
  promising: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  "needs-work": "border-amber-500/40 bg-amber-500/10 text-amber-400",
  unclear: "border-border bg-secondary text-muted-foreground",
};

/** Renders the AI's draft tables/endpoints as the same markdown shape nx-compiler emits into db-schema.md/api-routes.md. */
function formatSchemaDraft(schema: BriefAnalysisResult["schema"]) {
  const dbSchema = schema.tables
    .map((t) => {
      const rel = t.relationships.length ? `\n  Relationships: ${t.relationships.join(", ")}` : "";
      return `### ${t.name}\n${t.purpose}\n- Columns: ${t.keyColumns.join(", ")}${rel}`;
    })
    .join("\n\n");

  const apiRoutes = schema.endpoints
    .map((e) => `- \`${e.method} ${e.path}\` — ${e.purpose}${e.authRequired ? " (auth required)" : ""}`)
    .join("\n");

  return { dbSchema, apiRoutes };
}

function BriefAnalysisPanel({
  projectId,
  idea,
  tech,
  onAccept,
  initialResult,
}: {
  projectId: string;
  idea: IdeaData;
  tech: { surfaces: string[]; capabilities: string[] };
  onAccept: (
    draft: { dbSchema: string; apiRoutes: string },
    insights: { sharpenedProblem: string; riskiestAssumptions: string[]; stackConcerns: string[] }
  ) => void;
  /** Pre-cached result to show immediately — e.g. from an example brief — so
   *  there's something on screen before the founder ever spends a real call. */
  initialResult?: BriefAnalysisResult;
}) {
  const [state, setState] = useState<AnalysisState>(() =>
    initialResult ? { status: "done", result: initialResult } : { status: "idle" }
  );
  const [isExample, setIsExample] = useState(!!initialResult);
  const [accepted, setAccepted] = useState(false);

  const canRun = idea.problem.trim().length > 0 && tech.surfaces.length > 0;

  const run = async () => {
    setState({ status: "loading" });
    setAccepted(false);
    setIsExample(false);
    try {
      const res = await fetch("/api/context/analyze-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, idea, tech }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Analysis failed.");
      setState({ status: "done", result: body.result as BriefAnalysisResult });
    } catch (e) {
      setState({ status: "error", message: e instanceof Error ? e.message : "Analysis failed." });
    }
  };

  const accept = () => {
    if (state.status !== "done") return;
    onAccept(formatSchemaDraft(state.result.schema), {
      sharpenedProblem: state.result.sharpenedProblem,
      riskiestAssumptions: state.result.riskiestAssumptions,
      stackConcerns: state.result.stackConcerns,
    });
    setAccepted(true);
  };

  return (
    <div className="mt-8 rounded-xl glass p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-accent-foreground">
          <SparklesIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium">AI brief analysis</div>
          <div className="truncate text-sm text-muted-foreground">
            Runs in nxstudio — idea pressure-test, stack check, and a starting data model + API surface
          </div>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={!canRun || state.status === "loading"}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {state.status === "loading" ? (
            <LoaderIcon className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <SparklesIcon className="h-3.5 w-3.5" />
          )}
          {state.status === "loading" ? "Analyzing…" : "Run"}
        </button>
      </div>

      {!canRun && state.status === "idle" && (
        <p className="mt-3 text-xs text-muted-foreground">
          Describe the problem above and pick at least one surface in Tech Stack to run this.
        </p>
      )}

      {state.status === "error" && <p className="mt-3 text-xs text-rose-400">{state.message}</p>}

      {state.status === "done" && (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase",
                VERDICT_STYLE[state.result.verdict]
              )}
            >
              {state.result.verdict.replace("-", " ")}
            </span>
            {isExample && (
              <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                Example output
              </span>
            )}
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground">Sharpened problem</div>
            <p className="mt-1 text-sm">{state.result.sharpenedProblem}</p>
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground">Riskiest assumptions</div>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
              {state.result.riskiestAssumptions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground">Who to interview first</div>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
              {state.result.whoToInterview.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>

          {state.result.stackConcerns.length > 0 && (
            <div>
              <div className="text-xs font-medium text-amber-400">Stack concerns</div>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
                {state.result.stackConcerns.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div className="text-xs font-medium text-muted-foreground">Starting data model</div>
            <div className="mt-1.5 space-y-2">
              {state.result.schema.tables.map((t) => (
                <div key={t.name} className="rounded-lg border border-border bg-secondary/30 p-2.5">
                  <div className="font-mono text-xs font-semibold">{t.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{t.purpose}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Columns: {t.keyColumns.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-muted-foreground">Starting API surface</div>
            <ul className="mt-1.5 space-y-1">
              {state.result.schema.endpoints.map((e, i) => (
                <li key={i} className="font-mono text-xs">
                  <span className="text-accent-foreground">{e.method}</span> {e.path}
                  <span className="ml-2 font-sans text-muted-foreground">— {e.purpose}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-3 border-t border-border pt-3">
            <button
              type="button"
              onClick={accept}
              disabled={accepted}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {accepted ? "Accepted" : "Accept into Brief"}
            </button>
            <span className="text-xs text-muted-foreground">
              {isExample
                ? "Showing example output — click Run above to analyze your own answers."
                : "Still a starting draft — edit or regenerate anytime before the build."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function IdeaPhase() {
  const {
    data,
    updateIdea,
    updateBrand,
    updateTech,
    updateSchemaDraft,
    updateBriefInsights,
    briefInsightsStale,
    toggleChecklist,
    isStepDone,
    activeId,
  } = useWorkspace();
  const { prompts } = useCompiledPrompts();
  const [selectedExample, setSelectedExample] = useState<ExampleBrief | null>(null);

  const answered = QUESTIONS.filter((q) => data.idea[q.field].trim().length > 0).length;
  const percent = Math.round((answered / QUESTIONS.length) * 100);

  const stack = compileStack(data.tech);
  const stackConfigured = isStepDone("tech-stack", "configured");
  const confirmStack = () => {
    if (data.tech.surfaces.length > 0 && !stackConfigured) toggleChecklist("tech-stack", "configured");
  };

  const applyExample = (ex: ExampleBrief) => {
    (Object.keys(ex.idea) as (keyof IdeaData)[]).forEach((field) => updateIdea(field, ex.idea[field]));
    updateTech("surfaces", ex.tech.surfaces);
    updateTech("capabilities", ex.tech.capabilities);
    setSelectedExample(ex);
  };

  return (
    <>
      <PhaseHeader title="Brief" status="in-progress" phaseId="idea" showTeam />

      {/* Try an example — only while the brief is still empty, so it can't clobber real work */}
      {data.idea.problem.trim().length === 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-border p-3">
          <span className="text-xs text-muted-foreground">New here? Try an example —</span>
          {EXAMPLE_BRIEFS.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => applyExample(ex)}
              className="rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-secondary"
            >
              {ex.label}
            </button>
          ))}
        </div>
      )}

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Tell us about your idea</h2>
          <span className="text-sm font-medium text-accent-foreground">
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
          Locked into the build prompt so generated code stays visually consistent — shared live with Studio.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Primary color — swatch picker + hex/name field */}
          <div>
            <span className="text-sm text-muted-foreground">Primary color</span>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="color"
                aria-label="Pick primary color"
                value={HEX6.test(data.brand.primaryColor) ? data.brand.primaryColor : "#6366f1"}
                onChange={(e) => updateBrand("primaryColor", e.target.value)}
                className="h-9 w-10 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent p-1"
              />
              <input
                value={data.brand.primaryColor}
                onChange={(e) => updateBrand("primaryColor", e.target.value)}
                placeholder="#6366F1 or indigo"
                className="w-full rounded-lg border border-border bg-secondary/30 p-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
              />
            </div>
          </div>

          {/* Typography */}
          <div>
            <span className="text-sm text-muted-foreground">Typography</span>
            <select
              value={FONTS.includes(data.brand.font as (typeof FONTS)[number]) ? data.brand.font : ""}
              onChange={(e) => updateBrand("font", e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-secondary/30 p-2.5 text-sm outline-none focus:border-ring"
            >
              <option value="" disabled>
                Choose a font…
              </option>
              {FONTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Vibe — segmented, matches Studio */}
          <div>
            <span className="text-sm text-muted-foreground">Vibe</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {VIBES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => updateBrand("vibe", v)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm capitalize transition-colors",
                    data.brand.vibe === v
                      ? "border-primary bg-primary/15 text-accent-foreground"
                      : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Corner radius — slider, matches Studio */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Corner radius</span>
              <span className="text-sm font-medium">{radiusToNum(data.brand.radius)}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={24}
              step={1}
              value={radiusToNum(data.brand.radius)}
              onChange={(e) => updateBrand("radius", `${e.target.value}px`)}
              className="mt-2.5 w-full accent-primary"
            />
          </div>
        </div>
      </div>

      {/* Prompt output */}
      <div className="mt-6 flex items-center gap-4 rounded-xl glass p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-accent-foreground">
          <WandIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium">Pressure-test this idea</div>
          <div className="truncate text-sm text-muted-foreground">
            Riskiest assumptions, who to interview, a sharpened problem statement
          </div>
        </div>
        <CopyButton value={prompts?.idea.prompt ?? ""} label="Copy" variant="solid" />
      </div>

      <TechStackPhase />

      <BriefAnalysisPanel
        key={selectedExample?.id ?? "live"}
        projectId={activeId}
        idea={data.idea}
        tech={data.tech}
        onAccept={(draft, insights) => {
          updateSchemaDraft(draft);
          updateBriefInsights({
            ...insights,
            sourceIdea: data.idea,
            sourceCapabilities: data.tech.capabilities,
            sourceSurfaces: data.tech.surfaces,
          });
        }}
        initialResult={selectedExample?.analysis}
      />

      {/* Persistent view of the accepted analysis — survives a reload, unlike
          BriefAnalysisPanel's own internal state, which resets on mount. */}
      {data.briefInsights && (
        <div
          className={cn(
            "mt-4 rounded-xl glass p-5",
            briefInsightsStale && "border border-amber-500/40"
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Accepted analysis</span>
            {briefInsightsStale && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase text-amber-400">
                <AlertTriangleIcon className="h-3 w-3" />
                Idea changed since this ran
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{data.briefInsights.sharpenedProblem}</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
            {data.briefInsights.riskiestAssumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
          {briefInsightsStale && (
            <p className="mt-3 text-xs text-amber-400/90">
              You&apos;ve edited the idea or capabilities since this ran — the risks above may no
              longer match. Run the analysis above again to refresh them.
            </p>
          )}
        </div>
      )}

      {/* Continue — requires both the idea questions and a stack, so the build
          prompt never ships with "(not provided)" standing in for the brief. */}
      {stack && answered === QUESTIONS.length ? (
        <div className="mt-6 flex justify-end">
          <Link
            href="/canvas/build"
            onClick={confirmStack}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Continue to Build
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>
      ) : stack ? (
        <p className="mt-6 text-right text-xs text-muted-foreground">
          Answer the {QUESTIONS.length - answered} remaining question
          {QUESTIONS.length - answered === 1 ? "" : "s"} above to continue to Build.
        </p>
      ) : null}
    </>
  );
}
