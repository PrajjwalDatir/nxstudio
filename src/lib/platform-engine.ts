/**
 * Platform Engine — the invisible "Staff Engineer".
 *
 * There is NO reasoning layer here. Every framework decision is a hardcoded
 * lookup from the founder's form input. The founder picks intent (platform,
 * native vs cross-platform, backend needs); this file deterministically
 * resolves the concrete stack.
 *
 * Core rules (as specified):
 *   - iOS + Android together        → Flutter (single cross-platform codebase)
 *   - Native iOS only               → Swift / SwiftUI
 *   - Apple ecosystem (iOS/iPad/Mac)→ Swift / SwiftUI (Multiplatform)
 *   - Native Android only           → Kotlin / Jetpack Compose
 *   - Web app                       → Next.js
 *   - Web landing (rich/3D)         → Next.js + Three.js
 */

import {
  CompiledStack,
  PlatformTargetId,
  SetupPrompt,
  TechStackInput,
} from "./types";

/* ------------------------------------------------------------------ */
/* Platform options shown in the wizard                               */
/* ------------------------------------------------------------------ */

export interface PlatformOption {
  id: PlatformTargetId;
  label: string;
  description: string;
  icon: string; // emoji, matches the Figma's icon slots
  /** Whether a native-vs-cross-platform choice is relevant for this target. */
  offersStrategy: boolean;
}

export const PLATFORM_OPTIONS: PlatformOption[] = [
  {
    id: "web-app",
    label: "Web App (PWA)",
    description: "Installable web application, one codebase, no app store.",
    icon: "🌐",
    offersStrategy: false,
  },
  {
    id: "web-landing",
    label: "Landing / Marketing Site",
    description: "High-conversion marketing site, optionally rich & animated.",
    icon: "🖼️",
    offersStrategy: false,
  },
  {
    id: "ios",
    label: "iOS App",
    description: "Native application for the Apple App Store.",
    icon: "",
    offersStrategy: false,
  },
  {
    id: "android",
    label: "Android App",
    description: "Native application for the Google Play ecosystem.",
    icon: "🤖",
    offersStrategy: false,
  },
  {
    id: "mobile-both",
    label: "iOS + Android",
    description: "Ship to both mobile app stores.",
    icon: "📱",
    offersStrategy: true,
  },
  {
    id: "apple-ecosystem",
    label: "Apple Ecosystem",
    description: "iPhone, iPad, and Mac from a single Apple-native codebase.",
    icon: "",
    offersStrategy: false,
  },
];

export function getPlatformOption(
  id: PlatformTargetId | ""
): PlatformOption | undefined {
  return PLATFORM_OPTIONS.find((p) => p.id === id);
}

/** The platform NX recommends by default, surfaced in the wizard footer. */
export const RECOMMENDED_TARGET: PlatformTargetId = "web-app";
export const RECOMMENDED_REASON =
  "PWA — a single codebase, instant deployments, cross-device support, minimal cost, and no app store dependency.";

/* ------------------------------------------------------------------ */
/* Setup-prompt builders (per framework)                              */
/* ------------------------------------------------------------------ */

function nextSetupPrompts(input: TechStackInput): SetupPrompt[] {
  const prompts: SetupPrompt[] = [
    {
      id: "init",
      title: "Initialize Project",
      description: "Scaffold the Next.js app with TypeScript, Tailwind & ESLint.",
      command: "npx create-next-app@latest --typescript --tailwind --eslint",
    },
  ];
  if (input.needsDatabase) {
    prompts.push({
      id: "db",
      title: "Configure Database",
      description: "Set up Prisma schema with a PostgreSQL provider and connection strings.",
      command: "npm i prisma @prisma/client && npx prisma init --datasource-provider postgresql",
    });
  }
  if (input.needsAuth) {
    prompts.push({
      id: "auth",
      title: "Setup Authentication",
      description: "Configure NextAuth.js with standard providers and session management.",
      command: "npm i next-auth && npx auth secret",
    });
  }
  if (input.richGraphics) {
    prompts.push({
      id: "three",
      title: "Add 3D / WebGL Layer",
      description: "Install React Three Fiber and Drei for animated hero scenes.",
      command: "npm i three @react-three/fiber @react-three/drei",
    });
  }
  return prompts;
}

function flutterSetupPrompts(input: TechStackInput): SetupPrompt[] {
  const prompts: SetupPrompt[] = [
    {
      id: "init",
      title: "Initialize Project",
      description: "Scaffold the Flutter app targeting iOS and Android.",
      command: "flutter create --platforms=ios,android my_app",
    },
    {
      id: "state",
      title: "Add State & Routing",
      description: "Wire up Riverpod for state management and go_router for navigation.",
      command: "flutter pub add flutter_riverpod go_router",
    },
  ];
  if (input.needsDatabase || input.needsAuth || input.needsRealtime) {
    prompts.push({
      id: "supabase",
      title: "Connect Backend",
      description: "Add Supabase for auth, Postgres, and realtime channels.",
      command: "flutter pub add supabase_flutter",
    });
  }
  return prompts;
}

function swiftSetupPrompts(input: TechStackInput, apple: boolean): SetupPrompt[] {
  const prompts: SetupPrompt[] = [
    {
      id: "init",
      title: "Create Xcode Project",
      description: apple
        ? "Start a SwiftUI Multiplatform app (iOS, iPadOS, macOS)."
        : "Start a SwiftUI iOS app in Xcode.",
      command: apple
        ? "# Xcode › New Project › Multiplatform › App (SwiftUI)"
        : "# Xcode › New Project › iOS › App (SwiftUI)",
    },
    {
      id: "spm",
      title: "Add Dependencies (SPM)",
      description: "Use Swift Package Manager for networking and persistence.",
      command: "# File › Add Packages… › add supabase-swift / Alamofire",
    },
  ];
  if (input.needsDatabase || input.needsAuth) {
    prompts.push({
      id: "backend",
      title: "Wire Backend",
      description: "Connect Supabase for auth and a Postgres data layer.",
      command: "# Add https://github.com/supabase/supabase-swift via SPM",
    });
  }
  return prompts;
}

function kotlinSetupPrompts(input: TechStackInput): SetupPrompt[] {
  const prompts: SetupPrompt[] = [
    {
      id: "init",
      title: "Create Android Project",
      description: "Start a Jetpack Compose app in Android Studio.",
      command: "# Android Studio › New Project › Empty Activity (Compose)",
    },
    {
      id: "deps",
      title: "Add Dependencies",
      description: "Add Hilt for DI and Coroutines for async work in build.gradle.",
      command: "// implementation 'com.google.dagger:hilt-android'",
    },
  ];
  if (input.needsDatabase || input.needsAuth) {
    prompts.push({
      id: "backend",
      title: "Wire Backend",
      description: "Connect Firebase Auth + Firestore, or Supabase Postgres.",
      command: "// implementation platform('com.google.firebase:firebase-bom')",
    });
  }
  return prompts;
}

/* ------------------------------------------------------------------ */
/* The decision table                                                 */
/* ------------------------------------------------------------------ */

/**
 * Resolve founder input into a concrete stack. Pure, deterministic, hardcoded.
 * Returns null until enough has been chosen to decide.
 */
export function compileStack(input: TechStackInput): CompiledStack | null {
  if (!input.target) return null;

  const db = input.needsDatabase ? "PostgreSQL" : "None (client-side)";

  switch (input.target) {
    /* ---------------- Web ---------------- */
    case "web-app":
      return {
        platform: "WebApp (PWA)",
        frontend: "Next.js",
        backend: input.needsRealtime
          ? "Next.js API Routes + Supabase Realtime"
          : "Next.js API Routes",
        database: input.needsDatabase ? "PostgreSQL (Prisma)" : "None (client-side)",
        hosting: "Vercel",
        language: "TypeScript",
        rationale:
          "A single web codebase installs as a PWA across every device — instant deploys, no app-store gatekeeping.",
        setupPrompts: nextSetupPrompts(input),
      };

    case "web-landing":
      return {
        platform: "Landing Site",
        frontend: input.richGraphics ? "Next.js + Three.js" : "Next.js",
        backend: "Edge Functions",
        database: input.needsDatabase ? "PostgreSQL (Supabase)" : "None",
        hosting: "Vercel",
        language: "TypeScript",
        rationale: input.richGraphics
          ? "Marketing surface with an animated WebGL hero — Next.js SSR for SEO, Three.js for the wow."
          : "SEO-first marketing site on Next.js SSR, deployed to the edge.",
        setupPrompts: nextSetupPrompts(input),
      };

    /* ---------------- Mobile: both stores → Flutter ---------------- */
    case "mobile-both":
      // Founder can force fully-native dual builds; default is cross-platform.
      if (input.strategy === "native") {
        return {
          platform: "iOS + Android (Native)",
          frontend: "SwiftUI + Jetpack Compose",
          backend: "Supabase",
          database: db,
          hosting: "Supabase",
          language: "Swift + Kotlin",
          rationale:
            "Two fully-native codebases for maximum per-platform fidelity — pick this only when native feel outweighs shared code.",
          setupPrompts: [
            ...swiftSetupPrompts(input, false),
            ...kotlinSetupPrompts(input),
          ],
        };
      }
      return {
        platform: "iOS + Android",
        frontend: "Flutter",
        backend: "Supabase",
        database: db,
        hosting: "Supabase",
        language: "Dart",
        rationale:
          "Both stores from one codebase — Flutter is the default when you need iOS and Android without maintaining two native apps.",
        setupPrompts: flutterSetupPrompts(input),
      };

    /* ---------------- iOS native ---------------- */
    case "ios":
      // Even if the founder toggled cross-platform, an iOS-only target
      // stays Apple-native (SwiftUI) — cross-platform only matters with Android.
      return {
        platform: "iOS (Native)",
        frontend: "SwiftUI",
        backend: "Supabase",
        database: db,
        hosting: "Supabase",
        language: "Swift",
        rationale:
          "One target, the Apple platform — SwiftUI gives the most native feel with the least overhead.",
        setupPrompts: swiftSetupPrompts(input, false),
      };

    /* ---------------- Apple ecosystem ---------------- */
    case "apple-ecosystem":
      return {
        platform: "Apple Ecosystem",
        frontend: "SwiftUI (Multiplatform)",
        backend: "Supabase",
        database: db,
        hosting: "Supabase / CloudKit",
        language: "Swift",
        rationale:
          "iPhone, iPad, and Mac from one Apple-native codebase — Swift/SwiftUI Multiplatform, no cross-platform runtime needed.",
        setupPrompts: swiftSetupPrompts(input, true),
      };

    /* ---------------- Android native ---------------- */
    case "android":
      return {
        platform: "Android (Native)",
        frontend: "Jetpack Compose",
        backend: "Firebase / Supabase",
        database: input.needsDatabase ? "Firestore / PostgreSQL" : "Room (local)",
        hosting: "Firebase",
        language: "Kotlin",
        rationale:
          "One target, Google Play — Kotlin + Jetpack Compose is the modern native Android baseline.",
        setupPrompts: kotlinSetupPrompts(input),
      };

    default:
      return null;
  }
}

/** Convenience: the 5 stack slots the summary card renders. */
export function stackSlots(stack: CompiledStack) {
  return [
    { label: "Platform", value: stack.platform },
    { label: "Frontend", value: stack.frontend },
    { label: "Backend", value: stack.backend },
    { label: "Database", value: stack.database },
    { label: "Hosting", value: stack.hosting },
  ];
}
