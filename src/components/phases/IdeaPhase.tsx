"use client";

import { useRef, useState, useId, useEffect } from "react";
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
import { SchemaVisualizer } from "@/components/schema/SchemaVisualizer";
import { PhaseSectionNav, type PhaseSectionItem } from "./PhaseSectionNav";
import { BrandAssetUploader } from "@/components/brand/BrandAssetUploader";
import { PaletteGenerator } from "@/components/brand/PaletteGenerator";
import Link from "next/link";
import {
  PaperclipIcon,
  MicIcon,
  WandIcon,
  ChevronRightIcon,
  SparklesIcon,
  LoaderIcon,
  AlertTriangleIcon,
  LightbulbIcon,
  PaletteIcon,
  LayersIcon,
  DatabaseIcon,
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
  const typographyId = useId();
  const radiusId = useId();

  const {
    data,
    updateIdea,
    updateBrand,
    updateTech,
    updateSchema,
    updateSchemaDraft,
    updateBriefInsights,
    briefInsightsStale,
    toggleChecklist,
    isStepDone,
    activeId,
  } = useWorkspace();
  const { prompts } = useCompiledPrompts();
  const [selectedExample, setSelectedExample] = useState<ExampleBrief | null>(null);
  const [activeSection, setActiveSectionState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (["vision", "brand", "stack", "schema", "review"].includes(hash)) {
        return hash;
      }
      const saved = localStorage.getItem("nx_brief_active_section");
      if (saved && ["vision", "brand", "stack", "schema", "review"].includes(saved)) {
        return saved;
      }
    }
    return "vision";
  });

  const setActiveSection = (section: string) => {
    setActiveSectionState(section);
    if (typeof window !== "undefined") {
      localStorage.setItem("nx_brief_active_section", section);
    }
  };

  // Failsafe draft sync: if any question is empty on mount but a local draft exists, restore it immediately
  useEffect(() => {
    if (!activeId) return;
    const draftKey = `nx_draft_idea_${activeId}`;
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        QUESTIONS.forEach((q) => {
          if (!data.idea[q.field]?.trim() && draft[q.field]?.trim()) {
            updateIdea(q.field, draft[q.field]);
          }
        });
      }
    } catch {}
  }, [activeId]);

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

  const SECTIONS: PhaseSectionItem[] = [
    {
      id: "vision",
      label: "Vision & Idea",
      shortLabel: "Vision",
      description: "Define the core problem and differentiation",
      icon: LightbulbIcon,
      isDone: answered === QUESTIONS.length,
    },
    {
      id: "brand",
      label: "Brand DNA",
      shortLabel: "Brand",
      description: "Color, typography, radius and vibe tokens",
      icon: PaletteIcon,
      isDone: Boolean(data.brand.primaryColor && data.brand.font && data.brand.vibe),
    },
    {
      id: "stack",
      label: "Tech Stack",
      shortLabel: "Stack",
      description: "Surfaces, capabilities and architecture",
      icon: LayersIcon,
      isDone: data.tech.surfaces.length > 0,
    },
    {
      id: "schema",
      label: "Data Schema",
      shortLabel: "Schema",
      description: "Visual ERD, relational tables and DDL",
      icon: DatabaseIcon,
      isDone: Boolean(data.schema?.tables && data.schema.tables.length > 0),
    },
    {
      id: "review",
      label: "AI Review",
      shortLabel: "Review",
      description: "Pressure-test risks and finalize brief",
      icon: SparklesIcon,
      isDone: Boolean(data.briefInsights),
    },
  ];

  const continueButton = stack && answered === QUESTIONS.length ? (
    <Link
      href="/canvas/build"
      onClick={confirmStack}
      className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 hover:opacity-95"
    >
      Continue to Build
      <ChevronRightIcon className="h-4 w-4" />
    </Link>
  ) : stack ? (
    <p className="text-right text-xs text-muted-foreground">
      Answer the {QUESTIONS.length - answered} remaining question
      {QUESTIONS.length - answered === 1 ? "" : "s"} in Vision to continue to Build.
    </p>
  ) : null;

  return (
    <>
      <PhaseHeader title="Brief" status="in-progress" phaseId="idea" showTeam action={continueButton} />

      {/* Top Section Navigation */}
      <PhaseSectionNav
        sections={SECTIONS}
        activeId={activeSection}
        onSelect={setActiveSection}
        phaseLabel="Brief"
      />

      {/* ── SECTION 1: VISION & IDEA ─────────────────────────────────── */}
      {activeSection === "vision" && (
        <div className="space-y-6">
          {/* Try an example — only while the brief is still empty */}
          {data.idea.problem.trim().length === 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-border p-3">
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

          {/* Questions Progress */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Tell us about your idea</h2>
              <span className="text-xs font-mono font-medium text-accent-foreground">
                {answered} / {QUESTIONS.length} answered
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              These four answers define your core product contract across prompts, schemas, and architecture.
            </p>
          </div>

          {/* Question Cards */}
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

          {/* Prompt output: Pressure test */}
          <div className="flex items-center gap-4 rounded-xl glass p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-accent-foreground">
              <WandIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">Pressure-test this idea</div>
              <div className="truncate text-xs text-muted-foreground">
                Riskiest assumptions, who to interview, a sharpened problem statement
              </div>
            </div>
            <CopyButton value={prompts?.idea.prompt ?? ""} label="Copy" variant="solid" />
          </div>
        </div>
      )}

      {/* ── SECTION 2: BRAND DNA ─────────────────────────────────────── */}
      {activeSection === "brand" && (
        <div className="space-y-6">
          {/* Brand Identity & Vector Assets */}
          <div className="rounded-xl glass p-6">
            <div className="mb-4">
              <h3 className="font-semibold text-lg">Brand Identity & Assets</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Upload your brand icon mark and horizontal wordmark. These are embedded directly into design specifications and generated view layouts.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BrandAssetUploader
                label="Brand Mark / Logo"
                description="Square app icon, favicon mark, or avatar"
                assetUrl={data.brand.logo}
                assetName={data.brand.logoName}
                aspectHint="Square (1:1)"
                recommendedSize="SVG, PNG, or WebP up to 5MB"
                onUpload={(dataUrl, fileName) => {
                  updateBrand({ logo: dataUrl, logoName: fileName });
                }}
                onRemove={() => {
                  updateBrand({ logo: undefined, logoName: undefined });
                }}
              />
              <BrandAssetUploader
                label="Wordmark / Logotype"
                description="Horizontal typographic logo for navbars and splash screens"
                assetUrl={data.brand.wordmark}
                assetName={data.brand.wordmarkName}
                aspectHint="Horizontal (3:1 or 4:1)"
                recommendedSize="Transparent SVG, PNG, or WebP up to 5MB"
                onUpload={(dataUrl, fileName) => {
                  updateBrand({ wordmark: dataUrl, wordmarkName: fileName });
                }}
                onRemove={() => {
                  updateBrand({ wordmark: undefined, wordmarkName: undefined });
                }}
              />
            </div>
          </div>

          {/* Coolors.co-Style 5-Color Complete Palette Generator */}
          <PaletteGenerator
            palette={
              data.brand.palette && data.brand.palette.length === 5
                ? data.brand.palette
                : [
                    data.brand.primaryColor || "#8B5CF6",
                    data.brand.secondaryColor || "#EC4899",
                    data.brand.accentColor || "#38BDF8",
                    data.brand.backgroundColor || "#09090B",
                    data.brand.textColor || "#F8FAFC",
                  ]
            }
            onChangePalette={(newPalette) => {
              updateBrand({
                palette: newPalette,
                primaryColor: newPalette[0],
                secondaryColor: newPalette[1],
                accentColor: newPalette[2],
                backgroundColor: newPalette[3],
                textColor: newPalette[4],
              });
            }}
          />

          {/* Typography & Aesthetic System */}
          <div className="rounded-xl glass p-6">
            <h3 className="font-semibold text-lg">Typography & Aesthetics</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Locked into the build prompt and compiled into W3C DTCG tokens (`.nx/ui/design-tokens.json`) so generated code stays visually consistent.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Typography */}
              <div>
                <label htmlFor={typographyId} className="text-xs font-medium text-muted-foreground block">
                  Primary Typography
                </label>
                <select
                  id={typographyId}
                  value={data.brand.font || "Inter"}
                  onChange={(e) => updateBrand("font", e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-border bg-secondary/30 p-2.5 text-sm outline-none focus:border-ring font-mono"
                >
                  {Array.from(new Set([data.brand.font || "Inter", ...FONTS])).filter(Boolean).map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              {/* Corner radius — slider */}
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor={radiusId} className="text-xs font-medium text-muted-foreground block">
                    Base Corner Radius
                  </label>
                  <span className="font-mono text-xs font-semibold">{radiusToNum(data.brand.radius)}px</span>
                </div>
                <input
                  id={radiusId}
                  type="range"
                  min={0}
                  max={24}
                  step={1}
                  value={radiusToNum(data.brand.radius)}
                  onChange={(e) => updateBrand("radius", `${e.target.value}px`)}
                  className="mt-2.5 w-full accent-primary cursor-pointer"
                />
              </div>

              {/* Vibe — segmented */}
              <div className="sm:col-span-2">
                <span className="text-xs font-medium text-muted-foreground block">Vibe & Aesthetic</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {VIBES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => updateBrand("vibe", v)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs capitalize transition-all",
                        data.brand.vibe === v
                          ? "border-primary bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Token Live Preview Card */}
          <div
            style={{
              backgroundColor: data.brand.backgroundColor || "#09090B",
              borderColor: (data.brand.secondaryColor || "#27272A") + "40",
              color: data.brand.textColor || "#F8FAFC",
            }}
            className="rounded-2xl border p-6 shadow-sm transition-colors overflow-hidden"
          >
            <div
              className="flex items-center justify-between border-b pb-4 mb-5"
              style={{ borderColor: (data.brand.textColor || "#F8FAFC") + "15" }}
            >
              <div className="flex items-center gap-3">
                {data.brand.logo ? (
                  <img
                    src={data.brand.logo}
                    alt="Logo preview"
                    className="h-8 w-8 rounded-lg object-contain"
                  />
                ) : (
                  <div
                    style={{
                      backgroundColor: data.brand.primaryColor || "#8B5CF6",
                      borderRadius: data.brand.radius || "8px",
                    }}
                    className="flex h-8 w-8 items-center justify-center font-bold text-white text-xs shadow-xs"
                  >
                    Nx
                  </div>
                )}
                {data.brand.wordmark ? (
                  <img
                    src={data.brand.wordmark}
                    alt="Wordmark preview"
                    className="h-7 max-w-[140px] object-contain"
                  />
                ) : (
                  <span
                    style={{ fontFamily: data.brand.font || "inherit" }}
                    className="font-bold text-sm tracking-tight"
                  >
                    {data.productName || "Product Studio"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  style={{
                    backgroundColor: (data.brand.accentColor || "#38BDF8") + "20",
                    color: data.brand.accentColor || "#38BDF8",
                    borderColor: (data.brand.accentColor || "#38BDF8") + "40",
                    borderRadius: data.brand.radius || "6px",
                  }}
                  className="rounded-md border px-2 py-0.5 text-[11px] font-mono font-semibold"
                >
                  {data.brand.vibe || "v1.0"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                style={{
                  borderRadius: data.brand.radius || "10px",
                  borderColor: (data.brand.secondaryColor || "#27272A") + "50",
                  backgroundColor: "rgba(255,255,255,0.03)",
                }}
                className="border p-4 flex flex-col justify-between"
              >
                <div>
                  <h4 style={{ fontFamily: data.brand.font || "inherit" }} className="text-xs font-semibold mb-1">
                    Primary CTA Action
                  </h4>
                  <p className="text-[11px] opacity-70 mb-4">
                    Derived using primary token {data.brand.primaryColor || "#8B5CF6"}.
                  </p>
                </div>
                <button
                  type="button"
                  style={{
                    backgroundColor: data.brand.primaryColor || "#8B5CF6",
                    borderRadius: data.brand.radius || "8px",
                    fontFamily: data.brand.font || "inherit",
                    color: "#FFFFFF",
                  }}
                  className="w-full py-2 text-xs font-semibold shadow-xs hover:opacity-95 transition-opacity"
                >
                  Get Started Now
                </button>
              </div>

              <div
                style={{
                  borderRadius: data.brand.radius || "10px",
                  borderColor: (data.brand.secondaryColor || "#27272A") + "50",
                  backgroundColor: "rgba(255,255,255,0.03)",
                }}
                className="border p-4 flex flex-col justify-between"
              >
                <div>
                  <h4 style={{ fontFamily: data.brand.font || "inherit" }} className="text-xs font-semibold mb-1">
                    Secondary Surface
                  </h4>
                  <p className="text-[11px] opacity-70 mb-4">
                    Derived using secondary token {data.brand.secondaryColor || "#EC4899"}.
                  </p>
                </div>
                <button
                  type="button"
                  style={{
                    borderColor: data.brand.secondaryColor || "#EC4899",
                    color: data.brand.secondaryColor || "#EC4899",
                    borderRadius: data.brand.radius || "8px",
                    fontFamily: data.brand.font || "inherit",
                  }}
                  className="w-full border py-2 text-xs font-semibold hover:bg-white/5 transition-colors"
                >
                  Learn More
                </button>
              </div>

              <div
                style={{
                  borderRadius: data.brand.radius || "10px",
                  borderColor: (data.brand.secondaryColor || "#27272A") + "50",
                  backgroundColor: "rgba(255,255,255,0.03)",
                }}
                className="border p-4 flex flex-col justify-between"
              >
                <div>
                  <h4 style={{ fontFamily: data.brand.font || "inherit" }} className="text-xs font-semibold mb-1">
                    Design System Specs
                  </h4>
                  <p className="text-[11px] opacity-70 mb-3 font-mono">
                    Font: {data.brand.font || "Inter"}<br />
                    Radius: {data.brand.radius || "8px"}<br />
                    Contrast: WCAG AA
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {(data.brand.palette || [
                    data.brand.primaryColor || "#8B5CF6",
                    data.brand.secondaryColor || "#EC4899",
                    data.brand.accentColor || "#38BDF8",
                    data.brand.backgroundColor || "#09090B",
                    data.brand.textColor || "#F8FAFC",
                  ]).map((col, i) => (
                    <div
                      key={i}
                      style={{ backgroundColor: col }}
                      className="h-5 flex-1 rounded-sm border border-white/10"
                      title={col}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 3: TECH STACK ────────────────────────────────────── */}
      {activeSection === "stack" && (
        <div className="space-y-6">
          <TechStackPhase />
        </div>
      )}

      {/* ── SECTION 4: DATA SCHEMA (ERD) ─────────────────────────────── */}
      {activeSection === "schema" && (
        <div className="space-y-6">
          <SchemaVisualizer data={data} onUpdateSchema={updateSchema} className="mt-0" />
        </div>
      )}

      {/* ── SECTION 5: AI REVIEW & INSIGHTS ──────────────────────────── */}
      {activeSection === "review" && (
        <div className="space-y-6">
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

          {/* Persistent view of accepted analysis */}
          {data.briefInsights && (
            <div
              className={cn(
                "rounded-xl glass p-5",
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

          {continueButton && (
            <div className="flex justify-end pt-4">
              {continueButton}
            </div>
          )}
        </div>
      )}
    </>
  );
}
