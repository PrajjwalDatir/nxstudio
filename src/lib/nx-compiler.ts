/**
 * .nx/ standard — spec, content builders, and PARSER.
 *
 * nx-studio never writes files. It does two things with .nx/:
 *   1. WRITE side: describe the directory + file contents *inside a prompt*
 *      (see prompts.ts::buildMasterPrompt) so the AI IDE creates it.
 *   2. READ side: parseNx() reconstructs project context from the files
 *      the IDE committed to GitHub (see the sync store).
 */

import { compileStack, CAPABILITY_OPTIONS, SURFACE_OPTIONS } from "./platform-engine";
import { BUILD_STEPS, ChecklistStep } from "./phases";
import {
  BrandDNA,
  Capability,
  CompiledStack,
  IdeaData,
  Surface,
  WorkspaceData,
  DagNode,
  WorkflowDag,
  NxDriftKind,
} from "./types";

export const NX_ROOT = ".nx";

export interface NxFile {
  path: string; // ".nx/decisions/tech-stack.md"
  content: string;
}

/* ------------------------------------------------------------------ */
/* WRITE side — Universal Language-Independent Compilers               */
/* ------------------------------------------------------------------ */

/**
 * Universal W3C Design Tokens Community Group (DTCG) specification.
 * Fully language-independent: consumable by Flutter ThemeData, SwiftUI ShapeStyle,
 * Jetpack Compose MaterialTheme, or Web Tailwind/CSS without platform bias.
 */
export function compileDesignTokens(data: WorkspaceData): string {
  const primary = data.brand.primaryColor || "#8B5CF6";
  const secondary = data.brand.secondaryColor || data.brand.palette?.[1] || "#EC4899";
  const accent = data.brand.accentColor || data.brand.palette?.[2] || "#38BDF8";
  const surface = data.brand.backgroundColor || data.brand.palette?.[3] || "#09090B";
  const onSurface = data.brand.textColor || data.brand.palette?.[4] || "#FAFAFA";
  const radius = data.brand.radius || "10px";
  const font = data.brand.font || "Inter";
  const vibe = data.brand.vibe || "minimal";

  const tokens = {
    $schema: "https://design-tokens.github.io/community-group/format/",
    meta: {
      product: data.productName || "Product",
      vibe,
      generatedBy: "Nx Studio Compiler",
      assets: {
        logo: data.brand.logoName || (data.brand.logo ? "logo (embedded)" : null),
        wordmark: data.brand.wordmarkName || (data.brand.wordmark ? "wordmark (embedded)" : null),
      },
    },
    color: {
      primary: {
        $value: primary,
        $type: "color",
        $description: "Primary accent color for interactive elements and brand recognition",
      },
      secondary: {
        $value: secondary,
        $type: "color",
        $description: "Secondary brand color for auxiliary actions and components",
      },
      accent: {
        $value: accent,
        $type: "color",
        $description: "Highlight accent color for badges, tags, and callouts",
      },
      surface: {
        $value: surface,
        $type: "color",
        $description: "Baseline canvas surface color",
      },
      surface_raised: {
        $value: "#18181B",
        $type: "color",
        $description: "Elevated containers, cards, and modal surfaces",
      },
      on_surface: {
        $value: onSurface,
        $type: "color",
        $description: "High-contrast text on base surfaces",
      },
      on_surface_muted: {
        $value: "#A1A1AA",
        $type: "color",
        $description: "Subtle supporting metadata and labels",
      },
      border: {
        $value: "#27272A",
        $type: "color",
        $description: "Structural boundary stroke",
      },
      ...(data.brand.palette && data.brand.palette.length === 5
        ? {
            palette_slot_0: { $value: data.brand.palette[0], $type: "color", $description: "Primary slot" },
            palette_slot_1: { $value: data.brand.palette[1], $type: "color", $description: "Secondary slot" },
            palette_slot_2: { $value: data.brand.palette[2], $type: "color", $description: "Accent slot" },
            palette_slot_3: { $value: data.brand.palette[3], $type: "color", $description: "Background slot" },
            palette_slot_4: { $value: data.brand.palette[4], $type: "color", $description: "Text slot" },
          }
        : {}),
    },
    radius: {
      base: {
        $value: radius,
        $type: "dimension",
        $description: "Standard corner radius for interactive buttons and inputs",
      },
      card: {
        $value: radius.endsWith("px")
          ? `${Math.max(4, parseInt(radius, 10) + 4)}px`
          : "14px",
        $type: "dimension",
        $description: "Corner radius for containers and cards",
      },
      sm: {
        $value: radius.endsWith("px")
          ? `${Math.max(2, Math.round(parseInt(radius, 10) / 2))}px`
          : "4px",
        $type: "dimension",
      },
    },
    typography: {
      font_family: {
        $value: font,
        $type: "fontFamily",
        $description: "Primary application typeface",
      },
    },
  };

  return JSON.stringify(tokens, null, 2);
}

/**
 * Mathematical motion kinematics derived from Studio presets.
 * Framework-agnostic: specifies spring physics, duration, and easing curves.
 */
export function compileMotionSpec(data: WorkspaceData): string {
  const preset = data.brand.motionPreset || "none";
  const speed = parseFloat(data.brand.motionSpeed || "1") || 1;

  let spring = { stiffness: 100, damping: 14, mass: 1.0 };
  let curve = "cubic-bezier(0.16, 1, 0.3, 1)";
  let durationMs = Math.round(600 / speed);

  if (preset === "elastic") {
    spring = { stiffness: 180, damping: 9, mass: 1.0 };
    curve = "cubic-bezier(0.34, 1.56, 0.64, 1)";
    durationMs = Math.round(800 / speed);
  } else if (preset === "pulse") {
    spring = { stiffness: 120, damping: 20, mass: 1.0 };
    curve = "cubic-bezier(0.4, 0, 0.2, 1)";
    durationMs = Math.round(500 / speed);
  } else if (preset === "float") {
    spring = { stiffness: 70, damping: 12, mass: 1.2 };
    curve = "cubic-bezier(0.25, 0.8, 0.25, 1)";
    durationMs = Math.round(750 / speed);
  } else if (preset === "orbit" || preset === "spiral") {
    spring = { stiffness: 90, damping: 15, mass: 1.0 };
    curve = "linear";
    durationMs = Math.round(1200 / speed);
  }

  const spec = {
    $schema: "https://example.com/schemas/motion.v1.json",
    preset,
    speed,
    kinematics: {
      spring,
      curve,
      durationMs,
    },
    frameworkGuidance: {
      flutter: "Translate kinematics into CurvedAnimation or SpringSimulation.",
      swift: "Translate kinematics into withAnimation(.spring(response:dampingRatio:)).",
      web: "Map curve to CSS transition-timing-function or spring to Framer Motion / GSAP.",
      android: "Map kinematics to Jetpack Compose SpringSpec or tween.",
    },
  };

  return JSON.stringify(spec, null, 2);
}

/**
 * Universal SVG Wireframe layout blueprint exported for multimodal agent perception.
 */
export function compileWireframeSvg(data: WorkspaceData): string {
  const primary = data.brand.primaryColor || "#8B5CF6";
  const name = data.productName || "Application";
  const font = data.brand.font || "sans-serif";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <style>
      .bg { fill: #09090B; }
      .surface { fill: #18181B; stroke: #27272A; stroke-width: 1.5; rx: 8px; }
      .header { fill: #121215; stroke: #27272A; stroke-width: 1; }
      .accent { fill: ${primary}; rx: 6px; }
      .text-title { fill: #FAFAFA; font-family: ${font}; font-size: 16px; font-weight: 600; }
      .text-muted { fill: #71717A; font-family: ${font}; font-size: 12px; }
      .element { fill: #27272A; rx: 4px; }
    </style>
  </defs>
  <rect width="800" height="600" class="bg" />
  <rect x="0" y="0" width="800" height="54" class="header" />
  <rect x="24" y="16" width="120" height="22" class="accent" />
  <text x="32" y="32" fill="#FFFFFF" font-family="${font}" font-size="12px" font-weight="bold">${name.slice(0, 16)}</text>
  <rect x="680" y="14" width="96" height="26" class="accent" />
  
  <!-- Navigation Sidebar Rail -->
  <rect x="24" y="78" width="180" height="498" class="surface" />
  <rect x="44" y="104" width="140" height="14" class="element" />
  <rect x="44" y="132" width="110" height="14" class="element" />
  <rect x="44" y="160" width="130" height="14" class="element" />

  <!-- Main Viewport Canvas -->
  <rect x="224" y="78" width="552" height="498" class="surface" />
  <text x="254" y="120" class="text-title">${name} — Primary Viewport</text>
  <text x="254" y="142" class="text-muted">Universal Wireframe Blueprint (derived from Nx Studio canvas)</text>
  
  <rect x="254" y="170" width="492" height="180" class="element" fill-opacity="0.4" />
  <rect x="254" y="370" width="236" height="176" class="element" fill-opacity="0.4" />
  <rect x="510" y="370" width="236" height="176" class="element" fill-opacity="0.4" />
</svg>`;
}

/**
 * Emits .nx/db/schema.sql from the visual schema tables and relations.
 */
export function compileSqlSchema(data: WorkspaceData): string {
  const schema = data.schema;
  if (schema?.customSql !== undefined && schema.customSql.trim().length > 0) {
    return schema.customSql;
  }

  if (!schema || !schema.tables || schema.tables.length === 0) {
    return `-- .nx/db/schema.sql\n-- No visual schema tables defined yet.\n`;
  }

  const lines: string[] = [
    `-- .nx/db/schema.sql`,
    `-- Product: ${data.productName || "Product"}`,
    `-- Compiled from nxstudio Visual Schema Designer`,
    ``,
  ];

  for (const table of schema.tables) {
    lines.push(`CREATE TABLE IF NOT EXISTS "${table.name}" (`);
    const colDefs: string[] = [];

    for (const field of table.fields) {
      let sqlType = "TEXT";
      if (field.type === "uuid") sqlType = "UUID";
      else if (field.type === "int") sqlType = "INTEGER";
      else if (field.type === "float") sqlType = "DOUBLE PRECISION";
      else if (field.type === "boolean") sqlType = "BOOLEAN";
      else if (field.type === "datetime") sqlType = "TIMESTAMPTZ DEFAULT NOW()";
      else if (field.type === "json") sqlType = "JSONB";
      else if (field.type === "text") sqlType = "TEXT";
      else sqlType = "VARCHAR(255)";

      let col = `  "${field.name}" ${sqlType}`;
      if (field.isPrimary) col += " PRIMARY KEY";
      if (!field.isNullable && !field.isPrimary) col += " NOT NULL";
      if (field.isUnique && !field.isPrimary) col += " UNIQUE";
      colDefs.push(col);
    }

    const tableRelations = (schema.relations || []).filter((r) => r.sourceTableId === table.id);
    for (const rel of tableRelations) {
      const targetTable = schema.tables.find((t) => t.id === rel.targetTableId);
      const sourceField = table.fields.find((f) => f.id === rel.sourceFieldId);
      const targetField = targetTable?.fields.find((f) => f.id === rel.targetFieldId);
      if (targetTable && sourceField && targetField) {
        colDefs.push(
          `  CONSTRAINT "fk_${table.name}_${sourceField.name}" FOREIGN KEY ("${sourceField.name}") REFERENCES "${targetTable.name}"("${targetField.name}") ON DELETE CASCADE`
        );
      }
    }

    lines.push(colDefs.join(",\n"));
    lines.push(`);`);
    lines.push(``);
  }

  return lines.join("\n");
}

/**
 * Emits .nx/db/schema.prisma with typed models and relations.
 */
export function compilePrismaSchema(data: WorkspaceData): string {
  const schema = data.schema;
  if (schema?.customPrisma !== undefined && schema.customPrisma.trim().length > 0) {
    return schema.customPrisma;
  }

  if (!schema || !schema.tables || schema.tables.length === 0) {
    return `// .nx/db/schema.prisma\n// No visual schema tables defined yet.\n`;
  }

  const lines: string[] = [
    `// .nx/db/schema.prisma`,
    `// Product: ${data.productName || "Product"}`,
    `// Compiled from nxstudio Visual Schema Designer`,
    ``,
    `datasource db {`,
    `  provider = "postgresql"`,
    `  url      = env("DATABASE_URL")`,
    `}`,
    ``,
    `generator client {`,
    `  provider = "prisma-client-js"`,
    `}`,
    ``,
  ];

  for (const table of schema.tables) {
    const modelName = table.name.charAt(0).toUpperCase() + table.name.slice(1);
    lines.push(`model ${modelName} {`);

    for (const field of table.fields) {
      let pType = "String";
      let attrs = "";
      if (field.type === "uuid") {
        pType = "String";
        if (field.isPrimary) attrs += " @id @default(uuid())";
      } else if (field.type === "int") {
        pType = "Int";
        if (field.isPrimary) attrs += " @id @default(autoincrement())";
      } else if (field.type === "float") {
        pType = "Float";
      } else if (field.type === "boolean") {
        pType = "Boolean";
      } else if (field.type === "datetime") {
        pType = "DateTime";
        attrs += " @default(now())";
      } else if (field.type === "json") {
        pType = "Json";
      } else if (field.type === "text") {
        pType = "String";
      }

      if (field.isPrimary && !attrs.includes("@id")) attrs += " @id";
      if (field.isNullable) pType += "?";
      if (field.isUnique) attrs += " @unique";

      lines.push(`  ${field.name.padEnd(16)} ${pType}${attrs}`);
    }

    lines.push(`}`);
    lines.push(``);
  }

  return lines.join("\n");
}

/**
 * Topological Dependency DAG (Directed Acyclic Graph) for build task orchestration.
 * Assigns multi-agent specialist roles and enforces prerequisite-gated stages.
 */
export function compileDag(data: WorkspaceData): WorkflowDag {
  const hasVisualSchema = Boolean(data.schema?.tables && data.schema.tables.length > 0);
  const dataModelContracts = [`${NX_ROOT}/decisions/db-schema.md`];
  if (hasVisualSchema) {
    dataModelContracts.push(`${NX_ROOT}/db/schema.sql`, `${NX_ROOT}/db/schema.prisma`);
  }

  const nodes: DagNode[] = [
    {
      id: "task-0-scaffold",
      name: "Project Foundation & Scaffolding",
      description: "Initialize target repository, tooling, base dependencies, and verification scripts.",
      stage: 0,
      role: "devops-engineer",
      deps: [],
      contracts: [`${NX_ROOT}/memory.json`, `${NX_ROOT}/decisions/tech-stack.md`],
      verification: "Execute native project build (e.g. npm run build, flutter analyze, cargo check)",
    },
    {
      id: "task-1-data-model",
      name: "Data Modeling & Storage Contracts",
      description: "Define database schemas, migration stubs, and storage client configuration.",
      stage: 1,
      role: "database-architect",
      deps: ["task-0-scaffold"],
      contracts: dataModelContracts,
    },
    {
      id: "task-2-design-system",
      name: "Design Tokens & Theme Foundation",
      description: "Map universal design tokens and motion kinematics to target framework native theme.",
      stage: 1,
      role: "design-systems-engineer",
      deps: ["task-0-scaffold"],
      contracts: [`${NX_ROOT}/ui/design-tokens.json`, `${NX_ROOT}/ui/motion.json`],
    },
  ];

  const serviceDeps: string[] = ["task-1-data-model"];

  if (data.tech.capabilities.includes("auth")) {
    nodes.push({
      id: "task-3-auth",
      name: "Authentication & Identity Management",
      description: "Configure user authentication flows, session handling, and route/view access guards.",
      stage: 2,
      role: "backend-engineer",
      deps: ["task-1-data-model"],
    });
    serviceDeps.push("task-3-auth");
  }

  if (data.tech.capabilities.includes("payments")) {
    nodes.push({
      id: "task-3-payments",
      name: "Payments & Subscription Billing",
      description: "Implement payment processing, webhook listeners, and customer entitlement guards.",
      stage: 2,
      role: "backend-engineer",
      deps: ["task-1-data-model"],
    });
    serviceDeps.push("task-3-payments");
  }

  nodes.push({
    id: "task-3-api",
    name: "API Surface & Service Layer",
    description: "Implement endpoint handlers, business logic controllers, and service contracts.",
    stage: 2,
    role: "backend-engineer",
    deps: ["task-1-data-model"],
    contracts: [`${NX_ROOT}/specs/api-routes.md`],
  });
  serviceDeps.push("task-3-api");

  // Custom workflow stages inserted as intermediate DAG tasks if defined
  let lastCustomDeps = serviceDeps;
  if (data.customStages && data.customStages.length > 0) {
    data.customStages.forEach((stage) => {
      const taskId = `task-custom-${stage.id}`;
      nodes.push({
        id: taskId,
        name: stage.label,
        description: stage.description,
        stage: 3,
        role: "fullstack-developer",
        deps: lastCustomDeps,
        verification: stage.steps.map((s) => s.label).join("; "),
      });
      lastCustomDeps = [taskId];
    });
  }

  nodes.push({
    id: "task-4-views",
    name: "Core Views & User Interfaces",
    description: "Construct interactive views, connecting UI components to services and design system.",
    stage: 4,
    role: "frontend-specialist",
    deps: [...new Set([...lastCustomDeps, "task-2-design-system"])],
  });

  nodes.push({
    id: "task-5-verification",
    name: "Deterministic Verification & Polish",
    description: "Run test suites, defend against risks in risks.md, and finalize production deploy pipeline.",
    stage: 5,
    role: "qa-auditor",
    deps: ["task-4-views"],
    contracts: data.briefInsights ? [`${NX_ROOT}/risks.md`] : [],
    verification: "Verify against riskiest assumptions and checklist deliverables",
  });

  return {
    version: "1.0",
    project: data.productName || "Product",
    nodes,
  };
}

export function compileNxFiles(data: WorkspaceData): NxFile[] {
  const stack = compileStack(data.tech);
  const name = data.productName || "Untitled Product";

  const memory = {
    project: name,
    problem: data.idea.problem || "TBD",
    target_users: data.idea.targetUsers || "TBD",
    solutions: data.idea.currentSolutions || "TBD",
    differentiation: data.idea.differentiation || "TBD",
    stack: stack
      ? {
          surfaces: stack.platform,
          frontend: stack.frontend,
          language: stack.language,
          backend: stack.backend,
          database: stack.database,
          hosting: stack.hosting,
          libraries: stack.libraries,
        }
      : "Not yet configured",
    capabilities: data.tech.capabilities,
    brand: {
      vibe: data.brand.vibe,
      primary_color: data.brand.primaryColor,
      secondary_color: data.brand.secondaryColor || data.brand.palette?.[1] || null,
      accent_color: data.brand.accentColor || data.brand.palette?.[2] || null,
      background_color: data.brand.backgroundColor || data.brand.palette?.[3] || null,
      text_color: data.brand.textColor || data.brand.palette?.[4] || null,
      palette: data.brand.palette || null,
      logo: data.brand.logoName || (data.brand.logo ? "embedded" : null),
      wordmark: data.brand.wordmarkName || (data.brand.wordmark ? "embedded" : null),
      radius: data.brand.radius,
      font: data.brand.font,
      motion_preset: data.brand.motionPreset || "none",
      motion_speed: data.brand.motionSpeed || "1",
    },
    design_notes: data.designNotes || null,
    custom_stages: data.customStages?.length
      ? data.customStages.map((s) => ({ id: s.id, label: s.label, steps: s.steps.map((st) => st.label) }))
      : [],
    phases: {
      idea: data.idea.problem ? "done" : "pending",
      tech_stack: stack ? "done" : "pending",
      build: "pending",
    },
  };

  const files: NxFile[] = [
    { path: `${NX_ROOT}/memory.json`, content: JSON.stringify(memory, null, 2) },
    { path: `${NX_ROOT}/workflow.dag.json`, content: JSON.stringify(compileDag(data), null, 2) },
    { path: `${NX_ROOT}/ui/design-tokens.json`, content: compileDesignTokens(data) },
    { path: `${NX_ROOT}/ui/motion.json`, content: compileMotionSpec(data) },
    { path: `${NX_ROOT}/ui/wireframe.svg`, content: compileWireframeSvg(data) },
    {
      path: `${NX_ROOT}/idea.md`,
      content: `# Product Idea — ${name}

## Problem
${data.idea.problem || "_Not yet defined._"}

## Target Users
${data.idea.targetUsers || "_Not yet defined._"}

## How they solve it today
${data.idea.currentSolutions || "_Not yet defined._"}

## Our differentiation
${data.idea.differentiation || "_Not yet defined._"}
`,
    },
    {
      path: `${NX_ROOT}/decisions/tech-stack.md`,
      content: stack
        ? techStackDoc(stack)
        : "# Tech Stack\n\n_Complete the Tech Stack phase to generate this file._\n",
    },
    {
      path: `${NX_ROOT}/ui/brand-guide.md`,
      content: `# Brand Guide — ${name}

## Universal Design Tokens
For language-independent design tokens, inspect \`.nx/ui/design-tokens.json\` (W3C standard format).
For motion presets and animation curves, inspect \`.nx/ui/motion.json\`.
For layout wireframe hierarchy, inspect \`.nx/ui/wireframe.svg\`.

## Brand DNA
- **Vibe:** ${data.brand.vibe}
- **Primary Color:** ${data.brand.primaryColor}
${data.brand.secondaryColor || data.brand.palette?.[1] ? `- **Secondary Color:** ${data.brand.secondaryColor || data.brand.palette?.[1]}\n` : ""}${data.brand.accentColor || data.brand.palette?.[2] ? `- **Accent Color:** ${data.brand.accentColor || data.brand.palette?.[2]}\n` : ""}${data.brand.backgroundColor || data.brand.palette?.[3] ? `- **Background Surface Color:** ${data.brand.backgroundColor || data.brand.palette?.[3]}\n` : ""}${data.brand.textColor || data.brand.palette?.[4] ? `- **Typography Text Color:** ${data.brand.textColor || data.brand.palette?.[4]}\n` : ""}${data.brand.palette?.length === 5 ? `- **5-Color Harmonic Palette:** ${data.brand.palette.join(", ")}\n` : ""}- **Border Radius:** ${data.brand.radius}
- **Font:** ${data.brand.font}
${data.brand.logoName ? `- **Brand Logo / Icon:** Uploaded (${data.brand.logoName})\n` : ""}${data.brand.wordmarkName ? `- **Brand Wordmark:** Uploaded (${data.brand.wordmarkName})\n` : ""}${data.brand.motionPreset ? `- **Motion Preset:** ${data.brand.motionPreset}\n` : ""}
${
  data.designNotes
    ? `## Studio Design Notes & Canvas Annotations\n${data.designNotes}\n`
    : ""
}
## Implementation Rule
Map these design tokens to your target framework's native styling/theme system (e.g. Flutter ThemeData, SwiftUI ShapeStyle / Assets, Jetpack Compose MaterialTheme, or Web theme tokens). These visual tokens are NON-NEGOTIABLE for visual consistency.
`,
    },
    {
      path: `${NX_ROOT}/decisions/db-schema.md`,
      content: data.schemaDraft?.dbSchema
        ? `# Data Model

Database: **${stack?.database ?? "TBD"}**

${data.schemaDraft.dbSchema}

This is a starting design, not final DDL — adjust it as real features demand.
`
        : `# Data Model

Database: **${stack?.database ?? "TBD"}**

Define tables/collections here as features are built. Keep migrations in
version control. ${data.tech.capabilities.includes("auth") ? "Include a users table with auth provider IDs." : ""}
`,
    },
    {
      path: `${NX_ROOT}/specs/api-routes.md`,
      content: data.schemaDraft?.apiRoutes
        ? `# API Surface

Backend: **${stack?.backend ?? "TBD"}**

${data.schemaDraft.apiRoutes}

This is a starting design, not a final contract — adjust it as real features demand.
`
        : `# API Surface

Backend: **${stack?.backend ?? "TBD"}**

Document each endpoint (method, path, auth, request, response) as it is built.
`,
    },
    {
      path: `${NX_ROOT}/hosting.md`,
      content: `# Hosting & Deployment

Target: **${stack?.hosting ?? "TBD"}**

Configure CI/CD to deploy on push to \`main\`. Add preview deployments for PRs.
`,
    },
    { path: `${NX_ROOT}/checklist.md`, content: compileChecklistDoc(data) },
  ];

  if (data.briefInsights) {
    const { sharpenedProblem, riskiestAssumptions, stackConcerns } = data.briefInsights;
    files.push({
      path: `${NX_ROOT}/risks.md`,
      content: `# Risks & Assumptions — ${name}

An AI pressure-test of this brief, accepted by the founder. Defend against these
while building — don't just implement the happy path.

## Sharpened problem
${sharpenedProblem}

## Riskiest assumptions
${riskiestAssumptions.map((a) => `- ${a}`).join("\n")}
${
  stackConcerns.length
    ? `\n## Stack concerns\n${stackConcerns.map((c) => `- ${c}`).join("\n")}\n`
    : ""
}`,
    });
  }

  if (data.customStages && data.customStages.length > 0) {
    files.push({
      path: `${NX_ROOT}/custom-workflow.md`,
      content: `# Custom Product Workflow Stages

${data.customStages
  .map(
    (stage) =>
      `## ${stage.label}\n${stage.description}\n\n### Checklist Steps\n${stage.steps
        .map((step) => `- [ ] ${step.label}`)
        .join("\n")}`
  )
  .join("\n\n")}
`,
    });
  }

  // AGENTS.md — the open cross-tool standard (Linux Foundation; read natively
  // by Cursor, Windsurf/Devin Desktop, Zed, Aider, Antigravity, GitHub
  // Copilot, and most other agentic coding tools as of 2026) replaces what
  // used to be five separate, near-duplicate proprietary rule files.
  //
  // Each tool below still gets its own native file, but as a one-line pointer
  // rather than duplicated instructions. Claude Code's `@AGENTS.md` is an
  // officially documented import; Cursor has no such import *syntax*, but its
  // .mdc files are just prose an LLM agent reads and acts on — "read
  // AGENTS.md first" works as a plain instruction whether or not the tool
  // has a formal import mechanism for it. Only emitted for the founder's
  // selected agentTarget (see renderNxFileBlocks in prompts-server.ts) — no
  // point shipping five near-empty pointer files either.
  files.push(
    {
      path: "AGENTS.md",
      content: `# Agent Instructions — ${name}

When initiating or executing a build:
1. Read \`.nx/memory.json\`, \`.nx/workflow.dag.json\`, and the \`.nx/\` specifications to load the full architecture and execution graph.
2. Follow the Topological Dependency DAG in \`.nx/workflow.dag.json\`:
   - Respect dependency edges: Do not build downstream views or services before prerequisite contracts and models exist.
   - Independent branches (e.g. Design Tokens/UI theme vs Backend service routes) can be scaffolded in parallel.
3. Consult \`.nx/ui/design-tokens.json\` (W3C standard) and \`.nx/ui/motion.json\` to map design tokens into your target platform's native theme.
4. Mark completed deliverables in \`.nx/checklist.md\` as each task is implemented and verified.
`,
    },
    { path: ".claude/CLAUDE.md", content: `@AGENTS.md\n` },
    {
      path: ".cursor/rules/nx.mdc",
      content: `---
alwaysApply: true
---
Read \`AGENTS.md\` at the repo root first — it has the full architecture, brand, and build instructions.
`,
    },
    {
      // Legacy root file — still read by both Windsurf and its Devin Desktop
      // successor (Cognition's rebrand, June 2026); .devin/rules/ and
      // .windsurf/rules/ take precedence if the founder's own setup has them,
      // this is just the reliable fallback.
      path: ".windsurfrules",
      content: `Read AGENTS.md at the repo root first — it has the full architecture, brand, and build instructions.\n`,
    }
  );

  if (data.schema?.tables && data.schema.tables.length > 0) {
    files.push(
      { path: `${NX_ROOT}/db/schema.sql`, content: compileSqlSchema(data) },
      { path: `${NX_ROOT}/db/schema.prisma`, content: compilePrismaSchema(data) }
    );
  }

  return files;
}

/**
 * Renders the deliverables checklist as markdown checkboxes — the exact same
 * text both lands in the .nx/ bundle and is what "Copy checklist" copies, so
 * a straight content diff (see diffNx) is enough to tell whether the studio's
 * checklist has moved ahead of what's committed to the repo.
 */
/** Every fixed/custom checklist step that can render as a checkbox in checklist.md. */
function allChecklistSteps(data: WorkspaceData): ChecklistStep[] {
  const customSteps = data.customStages.find((s) => s.id === "checklist")?.steps ?? [];
  return [...BUILD_STEPS, ...(customSteps as ChecklistStep[])];
}

export function compileChecklistDoc(data: WorkspaceData): string {
  const steps = allChecklistSteps(data);
  const done = (id: string) =>
    (data.checklist["checklist"] ?? []).includes(id) || (data.checklist["build"] ?? []).includes(id);

  const lines = steps.map((s) => `- [${done(s.id) ? "x" : " "}] ${s.label}`);
  // Iterations are the post-launch changelog (see IterationEntry in types.ts) —
  // each feature/fix requested after the initial build gets its own line here,
  // so the checklist keeps growing instead of staying fixed at the 3 build steps.
  const iterationLines = data.iterations.map(
    (it) => `- [${it.status === "shipped" ? "x" : " "}] ${it.title}`
  );
  const allLines = [...lines, ...iterationLines];

  return `# Deliverables Checklist

${allLines.length ? allLines.join("\n") : "_No deliverables yet._"}

Keep this in sync as work lands — check items off, or add new ones, as you go.
`;
}

function techStackDoc(stack: CompiledStack): string {
  return `# Tech Stack Decision

| Slot | Choice |
| --- | --- |
| Surfaces | ${stack.platform} |
| Frontend | ${stack.frontend} |
| Language | ${stack.language} |
| Backend | ${stack.backend} |
| Database | ${stack.database} |
| Hosting | ${stack.hosting} |
| Libraries | ${stack.libraries.length ? stack.libraries.join(", ") : "—"} |

## Rationale
${stack.rationale}
`;
}

/* ------------------------------------------------------------------ */
/* READ side — parse .nx/ back from the connected repo           */
/* ------------------------------------------------------------------ */

export interface NxMemory {
  project?: string;
  problem?: string;
  target_users?: string;
  solutions?: string;
  differentiation?: string;
  stack?: { surfaces?: string; [key: string]: unknown } | string;
  capabilities?: string[];
  brand?: Record<string, string>;
  phases?: Record<string, string>;
}

export interface ParsedNx {
  /** Which of the standard files are present in the repo. */
  presentPaths: string[];
  /** Parsed memory.json, if present and valid. */
  memory: NxMemory | null;
  /** Raw contents of the .nx/ files we fetched from the repo (path → content). */
  docs: Record<string, string>;
  /** Standard paths nxstudio expects but the repo doesn't have yet. */
  missingPaths: string[];
  /** True if the .nx/ context directory exists at all. */
  exists: boolean;
}

/** The standard paths we look for when syncing a repo. */
export const NX_STANDARD_PATHS = [
  `${NX_ROOT}/memory.json`,
  `${NX_ROOT}/workflow.dag.json`,
  `${NX_ROOT}/ui/design-tokens.json`,
  `${NX_ROOT}/ui/motion.json`,
  `${NX_ROOT}/ui/wireframe.svg`,
  `${NX_ROOT}/idea.md`,
  `${NX_ROOT}/decisions/tech-stack.md`,
  `${NX_ROOT}/ui/brand-guide.md`,
  `${NX_ROOT}/decisions/db-schema.md`,
  `${NX_ROOT}/db/schema.sql`,
  `${NX_ROOT}/db/schema.prisma`,
  `${NX_ROOT}/specs/api-routes.md`,
  `${NX_ROOT}/hosting.md`,
  `${NX_ROOT}/checklist.md`,
];

/**
 * Reconstruct project context from the files fetched from the repo.
 * `files` maps repo path → file content. Presence-only entries (marked with an
 * empty string by the sync layer) count toward `presentPaths` but not `docs`.
 */
export function parseNx(files: Record<string, string>): ParsedNx {
  const presentPaths = Object.keys(files).filter((p) => p.startsWith(NX_ROOT));
  let memory: NxMemory | null = null;

  const memRaw = files[`${NX_ROOT}/memory.json`];
  if (memRaw) {
    try {
      memory = JSON.parse(memRaw) as NxMemory;
    } catch {
      memory = null;
    }
  }

  // Keep only the files we actually fetched content for (non-empty).
  const docs: Record<string, string> = {};
  for (const [p, content] of Object.entries(files)) {
    if (p.startsWith(NX_ROOT) && content) docs[p] = content;
  }

  const missingPaths = NX_STANDARD_PATHS.filter((p) => !presentPaths.includes(p));

  return {
    presentPaths,
    memory,
    docs,
    missingPaths,
    exists: presentPaths.length > 0,
  };
}

/* ------------------------------------------------------------------ */
/* DRIFT — Semantic diffing and categorization                         */
/* ------------------------------------------------------------------ */

export type NxDriftStatus =
  | "unchanged" // repo file matches what we'd emit now
  | "drifted" // exists in both, but the agent changed it in the repo
  | "missing" // we'd emit it, repo doesn't have it yet
  | "extra"; // repo has an .nx/ file we don't emit (agent added context)

export interface NxDrift {
  path: string;
  status: NxDriftStatus;
  kind?: NxDriftKind;
  summary?: string;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => deepEqual(val, b[idx]));
  }
  const keysA = Object.keys(a as Record<string, unknown>);
  const keysB = Object.keys(b as Record<string, unknown>);
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
    if (!deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])) return false;
  }
  return true;
}

function normalizeDoc(s: string): string {
  return s
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function areContentsEquivalent(path: string, contentA: string, contentB: string): boolean {
  if (normalizeDoc(contentA) === normalizeDoc(contentB)) return true;
  if (path.endsWith(".json")) {
    try {
      const objA = JSON.parse(contentA);
      const objB = JSON.parse(contentB);
      return deepEqual(objA, objB);
    } catch {
      return false;
    }
  }
  return false;
}

function classifyDrift(
  path: string,
  repoContent: string,
  emittedContent: string,
  data: WorkspaceData
): { kind: NxDriftKind; summary?: string } {
  if (path.endsWith("checklist.md")) {
    const repoDone = parseChecklistDone(repoContent);
    const emittedDone = parseChecklistDone(emittedContent);
    if (repoDone.size > emittedDone.size) {
      return {
        kind: "progress",
        summary: `${repoDone.size - emittedDone.size} additional task(s) completed in repo`,
      };
    }
    return { kind: "content", summary: "Checklist updated in repo" };
  }

  if (path.endsWith("workflow.dag.json")) {
    return { kind: "progress", summary: "Workflow execution graph updated in repo" };
  }

  if (path.endsWith("db-schema.md")) {
    const schema = parseDbSchemaMd(repoContent);
    if (schema && (!data.schemaDraft?.dbSchema || schema.length > data.schemaDraft.dbSchema.length)) {
      return { kind: "refinement", summary: "Data model extended by agent" };
    }
    return { kind: "refinement", summary: "Database schema modified" };
  }

  if (path.endsWith("api-routes.md")) {
    return { kind: "refinement", summary: "API surface modified by agent" };
  }

  if (path.endsWith("tech-stack.md")) {
    const repoSurfaces = parseTechStackSurfaces(repoContent);
    if (repoSurfaces && repoSurfaces.sort().join(",") !== data.tech.surfaces.sort().join(",")) {
      return { kind: "divergence", summary: "Target surfaces altered from brief" };
    }
    return { kind: "divergence", summary: "Tech stack specifications modified" };
  }

  if (path.endsWith("risks.md")) {
    return { kind: "refinement", summary: "Risk analysis updated" };
  }

  if (path.endsWith("design-tokens.json") || path.endsWith("brand-guide.md") || path.endsWith("motion.json")) {
    return { kind: "refinement", summary: "Visual tokens or kinematics updated" };
  }

  return { kind: "content", summary: "Content modified in repository" };
}

/**
 * Diff the .nx/ docs committed in the repo against what nxstudio would emit from
 * the current workspace. Compares semantically to prevent false positives on
 * whitespace, and classifies drift as progress, refinement, divergence, or content.
 */
export function diffNx(repoDocs: Record<string, string>, data: WorkspaceData): NxDrift[] {
  const emitted = compileNxFiles(data);
  const seen = new Set<string>();
  const out: NxDrift[] = [];

  for (const f of emitted) {
    seen.add(f.path);
    const repo = repoDocs[f.path];
    if (repo == null) {
      out.push({ path: f.path, status: "missing", kind: "missing" });
    } else if (!areContentsEquivalent(f.path, repo, f.content)) {
      const { kind, summary } = classifyDrift(f.path, repo, f.content, data);
      out.push({ path: f.path, status: "drifted", kind, summary });
    } else {
      out.push({ path: f.path, status: "unchanged", kind: "unchanged" });
    }
  }
  for (const path of Object.keys(repoDocs)) {
    if (!seen.has(path)) {
      out.push({ path, status: "extra", kind: "extra", summary: "Added by agent" });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* MERGE — Resilient reverse-parsing and bidirectional reconciliation  */
/* ------------------------------------------------------------------ */

/**
 * Extract one section's body from markdown with resilient, heading-tolerant matching.
 * Tolerates heading level differences (# vs ## vs ###), numbered prefixes (e.g. "1. Problem"),
 * trailing colons/dashes, bold wrappers, and case differences.
 */
export function mdSection(content: string, heading: string): string | null {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(?:^|\\n)#{1,4}\\s*(?:\\d+[.:]\\s*)?(?:\\*\\*)?${escaped}(?:\\*\\*)?(?:\\s*[:—–-]\\s*|\\s+Statement\\b|\\s*\\n)([\\s\\S]*?)(?=(?:\\n#{1,4}\\s|$))`,
    "i"
  );
  const m = content.match(pattern);
  if (!m) return null;
  const text = m[1].trim();
  return text && text !== "_Not yet defined._" ? text : "";
}

/** Resilient bullet list items supporting `-`, `*`, `+`, and numbered items (`1.`). */
export function mdBullets(section: string): string[] {
  return section
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^(?:[-*+]|\d+[.)])\s+/.test(l))
    .map((l) => l.replace(/^(?:[-*+]|\d+[.)])\s+/, "").trim())
    .filter(Boolean);
}

function parseIdeaMd(content: string): Partial<IdeaData> | null {
  const problem = mdSection(content, "Problem");
  const targetUsers = mdSection(content, "Target Users");
  const currentSolutions = mdSection(content, "How they solve it today");
  const differentiation = mdSection(content, "Our differentiation");
  if (problem === null && targetUsers === null && currentSolutions === null && differentiation === null) {
    return null;
  }
  const out: Partial<IdeaData> = {};
  if (problem !== null) out.problem = problem;
  if (targetUsers !== null) out.targetUsers = targetUsers;
  if (currentSolutions !== null) out.currentSolutions = currentSolutions;
  if (differentiation !== null) out.differentiation = differentiation;
  return out;
}

interface ParsedRisks {
  sharpenedProblem: string;
  riskiestAssumptions: string[];
  stackConcerns: string[];
}

function parseRisksMd(content: string): ParsedRisks | null {
  const sharpenedProblem = mdSection(content, "Sharpened problem");
  const riskSection = mdSection(content, "Riskiest assumptions");
  if (!sharpenedProblem || riskSection === null) return null;
  const riskiestAssumptions = mdBullets(riskSection);
  if (riskiestAssumptions.length === 0) return null;
  const concernSection = mdSection(content, "Stack concerns");
  const stackConcerns = concernSection ? mdBullets(concernSection) : [];
  return { sharpenedProblem, riskiestAssumptions, stackConcerns };
}

function parseBrandGuideMd(content: string): Partial<BrandDNA> | null {
  const field = (label: string) => {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const m = content.match(
      new RegExp(`(?:^|[\\n\\r])\\s*[-*+]?\\s*(?:\\*\\*)?${escaped}(?:\\*\\*)?\\s*[:=]\\s*([^\\n\\r]+)`, "i")
    );
    return m ? m[1].trim().replace(/^[`"']|[`"']$/g, "") : null;
  };
  const vibe = field("Vibe");
  const primaryColor = field("Primary Color") || field("Primary");
  const secondaryColor = field("Secondary Color") || field("Secondary");
  const accentColor = field("Accent Color") || field("Accent");
  const backgroundColor = field("Background Surface Color") || field("Background Color") || field("Background");
  const textColor = field("Typography Text Color") || field("Text Color");
  const radius = field("Border Radius") || field("Radius");
  const font = field("Font") || field("Typography");
  const motionPreset = field("Motion Preset") || field("Motion");
  const motionSpeed = field("Motion Speed");
  const paletteRaw = field("5-Color Harmonic Palette") || field("Palette");

  if (!vibe && !primaryColor && !radius && !font && !motionPreset && !motionSpeed && !secondaryColor && !accentColor && !backgroundColor && !textColor && !paletteRaw) return null;
  const out: Partial<BrandDNA> = {};
  if (vibe) out.vibe = vibe;
  if (primaryColor) out.primaryColor = primaryColor;
  if (secondaryColor) out.secondaryColor = secondaryColor;
  if (accentColor) out.accentColor = accentColor;
  if (backgroundColor) out.backgroundColor = backgroundColor;
  if (textColor) out.textColor = textColor;
  if (paletteRaw) {
    const parts = paletteRaw.split(/[, ]+/).filter(Boolean);
    if (parts.length === 5) out.palette = parts;
  }
  if (radius) out.radius = radius;
  if (font) out.font = font;
  if (motionPreset) out.motionPreset = motionPreset;
  if (motionSpeed) out.motionSpeed = motionSpeed;
  return out;
}

const SURFACE_NAME_TO_ID: Record<string, Surface> = Object.fromEntries(
  SURFACE_OPTIONS.map((o) => [o.label.toLowerCase(), o.id])
);

/** Reverse of surfaceLabel() in platform-engine.ts — "Web + iOS" back to ["web","ios"]. */
function parseTechStackSurfaces(content: string): Surface[] | null {
  const m = content.match(/\|\s*Surfaces\s*\|\s*(.+?)\s*\|/i);
  if (!m || m[1].trim() === "—") return null;
  const surfaces = m[1]
    .split(/[+,/]/)
    .map((s) => s.trim().toLowerCase())
    .map((s) => {
      if (SURFACE_NAME_TO_ID[s]) return SURFACE_NAME_TO_ID[s];
      for (const opt of SURFACE_OPTIONS) {
        if (opt.id.toLowerCase() === s || opt.label.toLowerCase() === s) return opt.id;
      }
      return null;
    })
    .filter((s): s is Surface => !!s);
  return surfaces.length ? surfaces : null;
}

function unwrapDoc(content: string, header: RegExp, footers: RegExp[]): string | null {
  const m = content.match(header);
  if (!m) return null;
  let body = m[1];
  for (const footer of footers) body = body.replace(footer, "");
  body = body.trim();
  return body || null;
}

function parseDbSchemaMd(content: string): string | null {
  return unwrapDoc(content, /# Data Model\s*\n+Database:\s*\*\*.*?\*\*\s*\n+([\s\S]*)$/i, [
    /\n*This is a starting design,[^\n]*$/i,
    /\n*Define tables\/collections here[\s\S]*$/i,
  ]);
}

function parseApiRoutesMd(content: string): string | null {
  return unwrapDoc(content, /# API Surface\s*\n+Backend:\s*\*\*.*?\*\*\s*\n+([\s\S]*)$/i, [
    /\n*This is a starting design,[^\n]*$/i,
    /\n*Document each endpoint[\s\S]*$/i,
  ]);
}

function parseChecklistDone(content: string): Set<string> {
  const done = new Set<string>();
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*[-*+]?\s*\[[xX]\]\s*(.+)$/);
    if (m) done.add(m[1].trim());
  }
  return done;
}

const CAPABILITY_IDS = new Set(CAPABILITY_OPTIONS.map((o) => o.id));

/**
 * Full auto-merge: reconcile repo-authored `.nx/` content back into
 * WorkspaceData. Only acts on files diffNx marks "drifted" — "missing"
 * (studio has more than the repo) and "unchanged"/"extra" need no
 * reconciliation. Repo wins on drift: whatever the agent committed is
 * treated as the founder's current intent.
 */
export function mergeNxIntoWorkspace(parsed: ParsedNx, data: WorkspaceData): Partial<WorkspaceData> {
  const drift = diffNx(parsed.docs, data);
  const drifted = new Set(drift.filter((d) => d.status === "drifted").map((d) => d.path));

  const memoryPath = `${NX_ROOT}/memory.json`;
  const ideaPath = `${NX_ROOT}/idea.md`;
  const risksPath = `${NX_ROOT}/risks.md`;
  const checklistPath = `${NX_ROOT}/checklist.md`;
  const brandPath = `${NX_ROOT}/ui/brand-guide.md`;
  const tokensPath = `${NX_ROOT}/ui/design-tokens.json`;
  const motionPath = `${NX_ROOT}/ui/motion.json`;
  const techStackPath = `${NX_ROOT}/decisions/tech-stack.md`;
  const dbSchemaPath = `${NX_ROOT}/decisions/db-schema.md`;
  const apiRoutesPath = `${NX_ROOT}/specs/api-routes.md`;

  let idea = data.idea;
  let brand = data.brand;
  let tech = data.tech;

  if (drifted.has(memoryPath) && parsed.memory) {
    const m = parsed.memory;
    const fromMemory: Partial<IdeaData> = {};
    if (typeof m.problem === "string") fromMemory.problem = m.problem;
    if (typeof m.target_users === "string") fromMemory.targetUsers = m.target_users;
    if (typeof m.solutions === "string") fromMemory.currentSolutions = m.solutions;
    if (typeof m.differentiation === "string") fromMemory.differentiation = m.differentiation;
    if (Object.keys(fromMemory).length) idea = { ...idea, ...fromMemory };
    if (m.brand) {
      const b: Partial<BrandDNA> = {};
      if (m.brand.vibe) b.vibe = m.brand.vibe;
      if (m.brand.primary_color) b.primaryColor = m.brand.primary_color;
      if (m.brand.secondary_color) b.secondaryColor = m.brand.secondary_color;
      if (m.brand.accent_color) b.accentColor = m.brand.accent_color;
      if (m.brand.background_color) b.backgroundColor = m.brand.background_color;
      if (m.brand.text_color) b.textColor = m.brand.text_color;
      if (Array.isArray(m.brand.palette)) b.palette = m.brand.palette;
      if (m.brand.radius) b.radius = m.brand.radius;
      if (m.brand.font) b.font = m.brand.font;
      if (m.brand.motion_preset) b.motionPreset = m.brand.motion_preset;
      if (m.brand.motion_speed) b.motionSpeed = m.brand.motion_speed;
      if (Object.keys(b).length) brand = { ...brand, ...b };
    }
    if (Array.isArray(m.capabilities)) {
      const caps = m.capabilities.filter((c): c is Capability => CAPABILITY_IDS.has(c as Capability));
      if (caps.length) tech = { ...tech, capabilities: caps };
    }
  }

  if (drifted.has(ideaPath)) {
    const doc = parsed.docs[ideaPath];
    const parsedIdea = doc ? parseIdeaMd(doc) : null;
    if (parsedIdea) idea = { ...idea, ...parsedIdea };
  }

  if (drifted.has(brandPath)) {
    const doc = parsed.docs[brandPath];
    const parsedBrand = doc ? parseBrandGuideMd(doc) : null;
    if (parsedBrand) brand = { ...brand, ...parsedBrand };
  }

  // Reverse-parse W3C design tokens if edited by agent in repo
  if (drifted.has(tokensPath)) {
    const doc = parsed.docs[tokensPath];
    if (doc) {
      try {
        const tokens = JSON.parse(doc);
        const b: Partial<BrandDNA> = {};
        if (tokens.color?.primary?.$value) b.primaryColor = tokens.color.primary.$value;
        if (tokens.color?.secondary?.$value) b.secondaryColor = tokens.color.secondary.$value;
        if (tokens.color?.accent?.$value) b.accentColor = tokens.color.accent.$value;
        if (tokens.color?.surface?.$value) b.backgroundColor = tokens.color.surface.$value;
        if (tokens.color?.on_surface?.$value) b.textColor = tokens.color.on_surface.$value;
        if (tokens.radius?.base?.$value) b.radius = tokens.radius.base.$value;
        if (tokens.typography?.font_family?.$value) b.font = tokens.typography.font_family.$value;
        if (tokens.meta?.vibe) b.vibe = tokens.meta.vibe;
        if (Object.keys(b).length) brand = { ...brand, ...b };
      } catch {
        /* Ignore malformed JSON */
      }
    }
  }

  // Reverse-parse motion spec if edited by agent in repo
  if (drifted.has(motionPath)) {
    const doc = parsed.docs[motionPath];
    if (doc) {
      try {
        const spec = JSON.parse(doc);
        const b: Partial<BrandDNA> = {};
        if (spec.preset) b.motionPreset = spec.preset;
        if (spec.speed != null) b.motionSpeed = String(spec.speed);
        if (Object.keys(b).length) brand = { ...brand, ...b };
      } catch {
        /* Ignore malformed JSON */
      }
    }
  }

  if (drifted.has(techStackPath)) {
    const doc = parsed.docs[techStackPath];
    const surfaces = doc ? parseTechStackSurfaces(doc) : null;
    if (surfaces) tech = { ...tech, surfaces };
  }

  const patch: Partial<WorkspaceData> = {};
  if (idea !== data.idea) patch.idea = idea;
  if (brand !== data.brand) patch.brand = brand;
  if (tech !== data.tech) patch.tech = tech;

  if (drifted.has(risksPath)) {
    const doc = parsed.docs[risksPath];
    const parsedRisks = doc ? parseRisksMd(doc) : null;
    if (parsedRisks) {
      patch.briefInsights = {
        ...parsedRisks,
        sourceIdea: patch.idea ?? data.idea,
        sourceCapabilities: (patch.tech ?? data.tech).capabilities,
        sourceSurfaces: (patch.tech ?? data.tech).surfaces,
      };
    }
  }

  if (drifted.has(dbSchemaPath) || drifted.has(apiRoutesPath)) {
    const dbDoc = parsed.docs[dbSchemaPath];
    const apiDoc = parsed.docs[apiRoutesPath];
    const dbSchema = drifted.has(dbSchemaPath) && dbDoc ? parseDbSchemaMd(dbDoc) : null;
    const apiRoutes = drifted.has(apiRoutesPath) && apiDoc ? parseApiRoutesMd(apiDoc) : null;
    if (dbSchema || apiRoutes) {
      patch.schemaDraft = {
        dbSchema: dbSchema ?? data.schemaDraft?.dbSchema ?? "",
        apiRoutes: apiRoutes ?? data.schemaDraft?.apiRoutes ?? "",
      };
    }
  }

  if (drifted.has(checklistPath)) {
    const doc = parsed.docs[checklistPath];
    if (doc) {
      const doneLabels = parseChecklistDone(doc);
      const steps = allChecklistSteps(data);
      const nextDone = new Set(data.checklist["checklist"] ?? []);
      let changed = false;
      for (const step of steps) {
        if (doneLabels.has(step.label) && !nextDone.has(step.id)) {
          nextDone.add(step.id);
          changed = true;
        }
      }
      const nextIterations = data.iterations.map((it) => {
        if (it.status === "shipped" || !doneLabels.has(it.title)) return it;
        changed = true;
        return { ...it, status: "shipped" as const };
      });
      if (changed) {
        patch.checklist = { ...data.checklist, checklist: [...nextDone] };
        patch.iterations = nextIterations;
      }
    }
  }

  return patch;
}

