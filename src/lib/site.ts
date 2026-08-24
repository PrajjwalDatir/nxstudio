/**
 * Single source of truth for site-wide identity + SEO metadata.
 *
 * Everything that describes "the site to the outside world" reads from here:
 * the root <head> metadata, Open Graph / Twitter cards, the generated OG image,
 * robots.txt, sitemap.xml, the web app manifest, the JSON-LD structured data,
 * the marketing landing page, and the legal pages. Change copy once, and every
 * surface (site, webapp, Vercel preview, social share, search, AI crawler)
 * stays in sync.
 */

// Prefer an explicit env (Vercel: NEXT_PUBLIC_SITE_URL). Fall back to the
// production domain, then to Vercel's per-deploy URL so preview builds get
// working absolute URLs for OG images.
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "https://nxstudio.dev";
}

export const siteConfig = {
  name: "nxstudio",
  /**
   * Browser-tab title. Kept deliberately short — a tab crops around ~30 chars,
   * so a long value just reads as a truncated fragment.
   */
  title: "nxstudio",
  /** Short label for the title template + PWA short_name. */
  shortName: "nxstudio",
  tagline: "Your staff-level tech cofounder.",
  description:
    "Bring your product brief. We'll architect the right tech stack and generate a production-ready build prompt so your AI agents can ship it flawlessly.",
  url: resolveSiteUrl(),
  ogImage: "/opengraph-image.png?v=20260825",
  themeColor: "#08080A",
  brandColor: "#C4B5FD",
  locale: "en_US",

  // ── People / entity ────────────────────────────────────────────────────
  authorName: "nx-studio",
  authorUrl: "https://nxstudio.dev",
  /** Twitter/X handle for twitter:creator + social links. */
  twitterHandle: "@nxstudio_dev",
  /**
   * Public contact address surfaced on the site + legal pages.
   * TODO(founder): swap for a support alias if you don't want a personal inbox.
   */
  contactEmail: "support@nxstudio.dev",
  /** Legal entity named in the Terms / Privacy pages. */
  legalEntity: "nxstudio (operated by nx-studio)",

  links: {
    x: "https://x.com/nxstudio_dev",
    author: "https://nxstudio.dev",
    productHuntReview:
      "https://www.producthunt.com/products/nxstudio/reviews/new?utm_source=badge-product_review&utm_medium=badge&utm_source=badge-nxstudio",
  },

  /** The AI coding agents nxstudio's build prompt is designed to pair with. */
  agents: ["Claude Code", "Cursor", "v0", "Windsurf"],

  /**
   * Keyword set aimed at both classic search and generative-engine (AI)
   * retrieval for "building products" and "prompts" intents.
   */
  keywords: [
    "build tool for founders",
    "AI build prompt",
    "prompt engineering for products",
    "tech stack generator",
    "turn idea into product",
    "founder tools",
    "product studio",
    "brand design tool",
    "generative design canvas",
    "MVP builder",
    "AI coding prompt",
    "vibe coding",
    "ship faster",
    "spec to prompt",
    "build prompt generator",
    "nxstudio",
  ],
} as const;

export type SiteConfig = typeof siteConfig;

/**
 * Per-page metadata builder for every public route.
 *
 * The root layout's `openGraph`/`twitter` blocks only get deep-merged
 * field-by-field with whatever a page defines — a page that sets just
 * `title` (not `openGraph.title`) still shares the homepage's OG title and
 * description when the link is posted on X/Slack/etc. This fills in the
 * matching `openGraph`/`twitter` title + description (and a canonical) for
 * every page so social shares and search snippets show that page's own
 * copy, not the landing page's.
 */
export function pageMetadata({
  path,
  title,
  description,
}: {
  /** Route path, e.g. "/pricing". Root layout's metadataBase resolves it to an absolute URL. */
  path: string;
  title: string;
  description: string;
}) {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
    },
    twitter: {
      title,
      description,
    },
  };
}
