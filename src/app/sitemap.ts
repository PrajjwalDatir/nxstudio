import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

// Only publicly reachable (unauthenticated) URLs belong here: the landing page,
// the sign-in page, and the legal pages. App routes live behind auth.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
  ) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });

  return [
    page("", 1, "weekly"),
    page("/pricing", 0.8, "weekly"),
    page("/faq", 0.6, "monthly"),
    page("/about", 0.6, "monthly"),
    page("/contact", 0.5, "monthly"),
    page("/login", 0.5, "monthly"),
    page("/privacy", 0.3, "yearly"),
    page("/terms", 0.3, "yearly"),
    page("/refund", 0.3, "yearly"),
  ];
}
