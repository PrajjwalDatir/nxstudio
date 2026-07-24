/**
 * Platform Engine — the invisible Staff Engineer.
 *
 * The founder never picks a framework. They pick the SURFACES they want to ship
 * to and the CAPABILITIES the product needs; this file derives the concrete
 * stack deterministically. No reasoning at runtime — just researched rules.
 *
 * Frontend rules (surfaces → framework), in priority order:
 *   iOS + Android (± web/desktop) ............ Flutter        (one codebase, all stores; Flutter Web + desktop)
 *   Desktop + one mobile ..................... Flutter        (only single codebase spanning desktop + mobile)
 *   Web + one mobile ......................... Expo (RN)      (web + iOS/Android from one TS codebase)
 *   iOS only ................................. SwiftUI        (most native feel)
 *   Android only ............................. Jetpack Compose(modern native baseline)
 *   Desktop + Web ............................ Next.js + Tauri(shared React: web + native desktop)
 *   Desktop only ............................. Tauri          (lightweight native desktop, Rust core)
 *   Web only ................................. Next.js (PWA)
 *
 * Backend rules (capabilities → services):
 *   Multiplayer/shared-live-state on a TS frontend .. SpacetimeDB (DB + server logic + realtime sync in one)
 *   Any of auth/db/realtime/storage/push ............ Supabase    (Postgres + Auth + Realtime + Storage)
 *   Nothing that needs a server ..................... client-only
 */

import { Capability, CompiledStack, StackSlot, Surface, TechStackInput } from "./types";

/* ------------------------------------------------------------------ */
/* Form metadata                                                      */
/* ------------------------------------------------------------------ */

export interface SurfaceOption {
  id: Surface;
  label: string;
  description: string;
  icon: string; // emoji
}

export const SURFACE_OPTIONS: SurfaceOption[] = [
  { id: "web", label: "Web", description: "Runs in the browser, installable as a PWA.", icon: "🌐" },
  { id: "ios", label: "iOS", description: "iPhone & iPad, the Apple App Store.", icon: "🍎" },
  { id: "android", label: "Android", description: "Phones & tablets on Google Play.", icon: "🤖" },
  { id: "desktop", label: "Desktop", description: "Windows, macOS & Linux apps.", icon: "🖥️" },
];

export interface CapabilityOption {
  id: Capability;
  label: string;
  description: string;
  icon: string;
}

export const CAPABILITY_OPTIONS: CapabilityOption[] = [
  { id: "auth", label: "Accounts & auth", description: "Sign-up, login, and sessions.", icon: "🔑" },
  { id: "database", label: "Database", description: "Persist users, content, and records.", icon: "🗄️" },
  { id: "realtime", label: "Realtime updates", description: "Live data & presence as it happens.", icon: "⚡" },
  { id: "multiplayer", label: "Multiplayer / shared state", description: "Many users on one live state — games, collaboration.", icon: "👥" },
  { id: "payments", label: "Payments & subscriptions", description: "Charge users and manage plans.", icon: "💳" },
  { id: "storage", label: "File storage", description: "Uploads, images, and documents.", icon: "📎" },
  { id: "push", label: "Push notifications", description: "Re-engage users on their device.", icon: "🔔" },
  { id: "ai", label: "AI / LLM features", description: "Generative or intelligent features.", icon: "✨" },
  { id: "graphics", label: "3D / rich graphics", description: "Immersive or animated surfaces.", icon: "🎨" },
];

/* ------------------------------------------------------------------ */
/* Derivation                                                         */
/* ------------------------------------------------------------------ */

interface Frontend {
  frontend: string;
  language: string;
  hosting: string;
  rationale: string;
}

function deriveFrontend(web: boolean, ios: boolean, android: boolean, desktop: boolean): Frontend {
  const mobileCount = (ios ? 1 : 0) + (android ? 1 : 0);

  if (ios && android) {
    const extra = web || desktop ? ", and reaches the same code to web and desktop" : "";
    return {
      frontend: "Flutter",
      language: "Dart",
      hosting: "App Store + Google Play" + (web ? " + Vercel (web)" : ""),
      rationale: `iOS and Android from one codebase — Flutter is the default when you need both stores${extra}.`,
    };
  }
  if (desktop && mobileCount === 1) {
    return {
      frontend: "Flutter",
      language: "Dart",
      hosting: "App stores + native installers",
      rationale: "Flutter is the only single codebase that cleanly spans mobile and desktop.",
    };
  }
  if (web && mobileCount === 1) {
    return {
      frontend: "Expo (React Native)",
      language: "TypeScript",
      hosting: "EAS (mobile) + Vercel (web)",
      rationale: "Expo (React Native) ships web, iOS, and Android from one TypeScript codebase.",
    };
  }
  if (mobileCount === 1) {
    return ios
      ? {
          frontend: "SwiftUI",
          language: "Swift",
          hosting: "App Store",
          rationale: "A single Apple target — SwiftUI gives the most native feel with the least overhead.",
        }
      : {
          frontend: "Jetpack Compose",
          language: "Kotlin",
          hosting: "Google Play",
          rationale: "A single Android target — Kotlin + Jetpack Compose is the modern native baseline.",
        };
  }
  if (desktop && web) {
    return {
      frontend: "Next.js + Tauri",
      language: "TypeScript + Rust",
      hosting: "Vercel (web) + native installers",
      rationale: "Shared React across web and desktop — Next.js on the web, wrapped by Tauri for a lightweight native desktop app.",
    };
  }
  if (desktop) {
    return {
      frontend: "Tauri",
      language: "TypeScript + Rust",
      hosting: "Native installers (GitHub Releases)",
      rationale: "A lightweight native desktop app — a web UI with a fast Rust core, far smaller than Electron.",
    };
  }
  // web only
  return {
    frontend: "Next.js (PWA)",
    language: "TypeScript",
    hosting: "Vercel",
    rationale: "A single web codebase installs as a PWA across every device — instant deploys, no app-store gatekeeping.",
  };
}

function graphicsLib(frontend: string): string {
  if (frontend.startsWith("Flutter")) return "Flame (2D/3D game engine)";
  if (frontend === "SwiftUI") return "SceneKit / RealityKit";
  if (frontend === "Jetpack Compose") return "OpenGL / Filament";
  return "Three.js + React Three Fiber";
}

function pushLib(frontend: string): string {
  if (frontend.startsWith("Expo")) return "Expo Notifications";
  if (frontend.startsWith("Next")) return "Web Push";
  return "Firebase Cloud Messaging (FCM)";
}

/**
 * Resolve founder input into a concrete stack. Pure and deterministic.
 * Returns null until at least one surface is chosen.
 */
export function compileStack(input: TechStackInput): CompiledStack | null {
  const surfaces = new Set(input.surfaces);
  if (surfaces.size === 0) return null;

  const web = surfaces.has("web");
  const ios = surfaces.has("ios");
  const android = surfaces.has("android");
  const desktop = surfaces.has("desktop");

  const { frontend, language, hosting, rationale } = deriveFrontend(web, ios, android, desktop);
  const isTs = language.startsWith("TypeScript");

  const caps = new Set(input.capabilities);
  const serverCaps: Capability[] = ["auth", "database", "realtime", "multiplayer", "storage", "push"];
  const needsBackend = serverCaps.some((c) => caps.has(c));

  let backend: string;
  let database: string;
  let backendRationale = "";

  if (caps.has("multiplayer") && isTs) {
    backend = "SpacetimeDB";
    database = "SpacetimeDB (relational, in-database logic)";
    backendRationale =
      " Multiplayer state is authoritative and synced in realtime by SpacetimeDB — the database runs your app logic and pushes state to every client, so there's no separate server.";
  } else if (needsBackend) {
    backend = "Supabase";
    database = caps.has("database") || caps.has("auth") || caps.has("multiplayer")
      ? "PostgreSQL (Supabase)"
      : "PostgreSQL (Supabase, minimal)";
    if (caps.has("multiplayer")) {
      // Multiplayer requested but on a non-TS frontend (Flutter/native) with no SpacetimeDB SDK.
      backendRationale =
        " Multiplayer runs on Supabase Realtime — SpacetimeDB has no Dart/Swift/Kotlin client SDK, so it isn't a fit for this frontend.";
    }
  } else {
    backend = "None (client-only)";
    database = "None (local device storage)";
  }

  const libraries: string[] = [];
  if (caps.has("payments")) libraries.push("Razorpay (payments & subscriptions)");
  if (caps.has("ai")) libraries.push(isTs ? "Vercel AI SDK" : "Provider AI SDK");
  if (caps.has("graphics")) libraries.push(graphicsLib(frontend));
  if (caps.has("push")) libraries.push(pushLib(frontend));
  if (caps.has("storage") && backend !== "Supabase" && backend !== "SpacetimeDB") {
    libraries.push("Supabase Storage");
  }

  return {
    platform: surfaceLabel(input.surfaces),
    frontend,
    backend,
    database,
    hosting,
    language,
    libraries,
    rationale: rationale + backendRationale,
  };
}

/** Human label for the chosen surface set, in a stable order. */
export function surfaceLabel(surfaces: Surface[]): string {
  const order: Surface[] = ["web", "ios", "android", "desktop"];
  const names: Record<Surface, string> = { web: "Web", ios: "iOS", android: "Android", desktop: "Desktop" };
  const picked = order.filter((s) => surfaces.includes(s));
  return picked.length ? picked.map((s) => names[s]).join(" + ") : "—";
}

/** The stack slots the summary renders. */
export function stackSlots(stack: CompiledStack): StackSlot[] {
  return [
    { label: "Surfaces", value: stack.platform },
    { label: "Frontend", value: stack.frontend },
    { label: "Language", value: stack.language },
    { label: "Backend", value: stack.backend },
    { label: "Database", value: stack.database },
    { label: "Hosting", value: stack.hosting },
  ];
}
