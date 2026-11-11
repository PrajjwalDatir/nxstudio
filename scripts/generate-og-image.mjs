#!/usr/bin/env node
/**
 * Captures a real screenshot of the live site's hero section and writes it
 * out as the Open Graph / Twitter card image, replacing the hand-drawn
 * placeholder. Run manually (npm run generate:og-image) or from CI after a
 * build, pointed at either the production URL or a local server.
 */
import { chromium } from "playwright";
import { copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetUrl = process.env.OG_IMAGE_URL || process.env.SITE_URL || "http://localhost:3000";
const ogImagePath = path.join(rootDir, "public/opengraph-image.png");
const twitterImagePath = path.join(rootDir, "public/twitter-image.png");

const browser = await chromium.launch({
  args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
});

try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
    // The site is dark-first (colorScheme: "dark" in the root layout) and only
    // switches to light when the OS reports a light preference. Playwright
    // defaults to light, which made captures render in the untuned light
    // theme (low-contrast badges, washed-out logos). Force dark so this
    // matches the actual default experience most visitors see.
    colorScheme: "dark",
  });

  // "networkidle" never resolves here — the site keeps background connections
  // open (analytics, the 3D scene's render loop) — so wait for "load" instead.
  await page.goto(targetUrl, { waitUntil: "load" });
  // Let the hero's entrance animation and the 3D mascot scene settle before capturing.
  await page.waitForTimeout(2500);
  await page.screenshot({ path: ogImagePath });

  copyFileSync(ogImagePath, twitterImagePath);
  console.log(`Wrote ${ogImagePath} and ${twitterImagePath} from ${targetUrl}`);
} finally {
  await browser.close();
}
