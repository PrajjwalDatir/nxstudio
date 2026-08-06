import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

// Web app manifest — installable PWA metadata + Android/Chrome theming.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.title,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: siteConfig.themeColor,
    theme_color: siteConfig.themeColor,
    categories: ["productivity", "developer", "business"],
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
      { src: "/icon", type: "image/png", sizes: "512x512", purpose: "maskable" },
    ],
  };
}
