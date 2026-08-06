import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

/**
 * robots.txt. Public marketing surfaces (root, /login) are indexable; the
 * authenticated app, API routes, and auth callbacks are not — crawlers get
 * bounced to /login anyway, and this keeps them out of the index as soft-404s.
 * AI answer-engine crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.) are
 * covered by the wildcard user-agent and are welcome to read the public pages.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ["GPTBot", "Claude-Web", "anthropic-ai", "CCBot", "PerplexityBot", "Google-Extended"],
        allow: "/",
        disallow: ["/api/", "/auth/", "/canvas", "/settings", "/tasks", "/team", "/projects", "/calendar", "/canvas/"],
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/", "/canvas", "/settings", "/tasks", "/team", "/projects", "/calendar", "/canvas/"],
      }
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
