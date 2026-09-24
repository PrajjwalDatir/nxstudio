// Color Palette Generator (Coolors.co inspired)
// HSL Color Harmonies, WCAG Contrast, and Curated Presets

export type PaletteHarmonyMode =
  | "smart"
  | "analogous"
  | "complementary"
  | "triadic"
  | "monochromatic"
  | "cyberpunk"
  | "editorial"
  | "nordic";

export interface PalettePreset {
  id: string;
  name: string;
  category: string;
  colors: [string, string, string, string, string]; // [Primary, Secondary, Accent, Background, Text]
}

export interface ColorSlotMeta {
  role: "Primary" | "Secondary" | "Accent" | "Background" | "Text";
  description: string;
}

export const PALETTE_SLOTS: ColorSlotMeta[] = [
  { role: "Primary", description: "Main brand accent & interactive buttons" },
  { role: "Secondary", description: "Supporting controls, badges & borders" },
  { role: "Accent", description: "Highlights, links & attention grabbers" },
  { role: "Background", description: "Canvas surface & container background" },
  { role: "Text", description: "Main typography & high-contrast content" },
];

/* ------------------------------------------------------------------ */
/* Color Math & Conversions                                           */
/* ------------------------------------------------------------------ */

export function normalizeHex(hex: string): string {
  let clean = hex.trim().replace(/^#/, "");
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  if (!/^[0-9A-Fa-f]{6}$/.test(clean)) {
    return "#8B5CF6";
  }
  return `#${clean.toUpperCase()}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const norm = normalizeHex(hex).replace("#", "");
  const num = parseInt(norm, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h = Math.round(h * 60);
  }

  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex(h: number, s: number, l: number): string {
  const hNorm = ((h % 360) + 360) % 360 / 360;
  const sNorm = Math.max(0, Math.min(100, s)) / 100;
  const lNorm = Math.max(0, Math.min(100, l)) / 100;

  let r = lNorm;
  let g = lNorm;
  let b = lNorm;

  if (sNorm !== 0) {
    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;
    const hue2rgb = (t: number) => {
      let val = t;
      if (val < 0) val += 1;
      if (val > 1) val -= 1;
      if (val < 1 / 6) return p + (q - p) * 6 * val;
      if (val < 1 / 2) return q;
      if (val < 2 / 3) return p + (q - p) * (2 / 3 - val) * 6;
      return p;
    };
    r = hue2rgb(hNorm + 1 / 3);
    g = hue2rgb(hNorm);
    b = hue2rgb(hNorm - 1 / 3);
  }

  return rgbToHex(r * 255, g * 255, b * 255);
}

/* ------------------------------------------------------------------ */
/* Luminance & WCAG Contrast                                          */
/* ------------------------------------------------------------------ */

export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const transform = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
}

export function getContrastRatio(hexA: string, hexB: string): number {
  const lumA = getRelativeLuminance(hexA);
  const lumB = getRelativeLuminance(hexB);
  const brighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  const ratio = (brighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 10) / 10;
}

export function getReadableTextColor(bgHex: string): string {
  const lum = getRelativeLuminance(bgHex);
  return lum > 0.42 ? "#09090B" : "#FFFFFF";
}

/* ------------------------------------------------------------------ */
/* Palette Generation Engine (Coolors Algorithm)                      */
/* ------------------------------------------------------------------ */

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateHarmonicPalette(
  locked: (string | null)[],
  mode: PaletteHarmonyMode = "smart"
): [string, string, string, string, string] {
  // Find reference base color from locked slots (prefer locked Primary slot 0, or any locked slot)
  const refHex = locked[0] ?? locked.find((c) => c !== null) ?? hslToHex(randomBetween(0, 360), randomBetween(70, 95), randomBetween(50, 65));
  const { r, g, b } = hexToRgb(refHex);
  const baseHsl = rgbToHsl(r, g, b);

  let newHues: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  let newSats: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  let newLights: [number, number, number, number, number] = [0, 0, 0, 0, 0];

  switch (mode) {
    case "analogous":
      newHues = [
        baseHsl.h,
        (baseHsl.h + 30) % 360,
        (baseHsl.h - 30 + 360) % 360,
        baseHsl.h,
        (baseHsl.h + 15) % 360,
      ];
      newSats = [baseHsl.s, Math.max(40, baseHsl.s - 10), Math.min(100, baseHsl.s + 15), 18, 10];
      newLights = [baseHsl.l, Math.min(85, baseHsl.l + 12), Math.max(35, baseHsl.l - 12), 6, 96];
      break;

    case "complementary":
      newHues = [
        baseHsl.h,
        (baseHsl.h + 180) % 360,
        (baseHsl.h + 150) % 360,
        baseHsl.h,
        (baseHsl.h + 180) % 360,
      ];
      newSats = [baseHsl.s, Math.min(95, baseHsl.s + 10), Math.min(100, baseHsl.s + 5), 15, 8];
      newLights = [baseHsl.l, Math.max(45, baseHsl.l - 5), Math.min(80, baseHsl.l + 15), 6, 97];
      break;

    case "triadic":
      newHues = [
        baseHsl.h,
        (baseHsl.h + 120) % 360,
        (baseHsl.h + 240) % 360,
        (baseHsl.h + 120) % 360,
        baseHsl.h,
      ];
      newSats = [baseHsl.s, Math.min(90, baseHsl.s + 5), Math.min(95, baseHsl.s + 10), 20, 10];
      newLights = [baseHsl.l, Math.min(75, baseHsl.l + 8), Math.max(40, baseHsl.l - 8), 5, 96];
      break;

    case "monochromatic":
      newHues = [baseHsl.h, baseHsl.h, baseHsl.h, baseHsl.h, baseHsl.h];
      newSats = [baseHsl.s, Math.max(35, baseHsl.s - 25), Math.min(100, baseHsl.s + 15), Math.max(10, baseHsl.s - 50), 12];
      newLights = [baseHsl.l, Math.min(80, baseHsl.l + 20), Math.max(35, baseHsl.l - 20), 7, 96];
      break;

    case "cyberpunk": {
      const neonHues = [170, 280, 320, 195, 50];
      const pickH = neonHues[randomBetween(0, neonHues.length - 1)];
      newHues = [baseHsl.h || pickH, (pickH + 110) % 360, (pickH + 200) % 360, 240, 180];
      newSats = [95, 95, 100, 30, 20];
      newLights = [58, 62, 60, 4, 98];
      break;
    }

    case "editorial": {
      const warmH = randomBetween(15, 38);
      newHues = [warmH, (warmH + 190) % 360, (warmH + 130) % 360, warmH, warmH + 5];
      newSats = [68, 42, 38, 24, 15];
      newLights = [54, 46, 68, 95, 14];
      break;
    }

    case "nordic": {
      const coolH = randomBetween(200, 225);
      newHues = [coolH, (coolH + 40) % 360, 160, coolH, coolH];
      newSats = [72, 58, 65, 22, 12];
      newLights = [55, 68, 52, 7, 96];
      break;
    }

    case "smart":
    default: {
      // Dynamic high-craft SaaS / modern app harmony
      const targetHue = locked[0] ? baseHsl.h : randomBetween(0, 360);
      const isDarkSurface = true;
      newHues = [
        targetHue,
        (targetHue + 45 + randomBetween(-10, 15)) % 360,
        (targetHue + 175 + randomBetween(-15, 20)) % 360,
        (targetHue + 210) % 360,
        targetHue,
      ];
      newSats = [
        randomBetween(75, 95),
        randomBetween(65, 88),
        randomBetween(80, 98),
        randomBetween(12, 28),
        randomBetween(8, 16),
      ];
      newLights = [
        randomBetween(54, 64),
        randomBetween(58, 70),
        randomBetween(55, 68),
        isDarkSurface ? randomBetween(4, 8) : randomBetween(94, 98),
        isDarkSurface ? randomBetween(95, 98) : randomBetween(8, 14),
      ];
      break;
    }
  }

  const generated = [0, 1, 2, 3, 4].map((i) => {
    if (locked[i]) {
      return normalizeHex(locked[i]!);
    }
    return hslToHex(newHues[i], newSats[i], newLights[i]);
  });

  return [generated[0], generated[1], generated[2], generated[3], generated[4]];
}

/* ------------------------------------------------------------------ */
/* Curated Presets (Inspired by iconic modern platforms)               */
/* ------------------------------------------------------------------ */

export const CURATED_PRESETS: PalettePreset[] = [
  {
    id: "nx-studio",
    name: "Nx Lilac (Default)",
    category: "Signature",
    colors: ["#A855F7", "#EC4899", "#38BDF8", "#09090B", "#F8FAFC"],
  },
  {
    id: "linear-dark",
    name: "Linear Obsidian",
    category: "Modern Tech",
    colors: ["#5E6AD2", "#8793FA", "#43B9B9", "#08090A", "#EDEDF0"],
  },
  {
    id: "stripe-indigo",
    name: "Stripe Indigo",
    category: "Fintech",
    colors: ["#635BFF", "#00D4FF", "#7A73FF", "#0A2540", "#FFFFFF"],
  },
  {
    id: "supabase-emerald",
    name: "Supabase Emerald",
    category: "Developer",
    colors: ["#3ECF8E", "#24B47E", "#F43F5E", "#171717", "#F5F5F5"],
  },
  {
    id: "raycast-coral",
    name: "Raycast Ember",
    category: "Productivity",
    colors: ["#FF6363", "#FF9066", "#FFD166", "#0E0E12", "#F6F6F9"],
  },
  {
    id: "cyberpunk-neon",
    name: "Tokyo Cyberpunk",
    category: "Vibrant",
    colors: ["#00F2FE", "#FF007F", "#7928CA", "#05050A", "#E0FFFF"],
  },
  {
    id: "warm-terracotta",
    name: "Editorial Terracotta",
    category: "Warm & Earthy",
    colors: ["#E07A5F", "#81B29A", "#F2CC8F", "#1D1E2C", "#F4F1DE"],
  },
  {
    id: "nordic-minimal",
    name: "Nordic Minimalist",
    category: "Clean",
    colors: ["#0284C7", "#64748B", "#38BDF8", "#0F172A", "#F8FAFC"],
  },
];
