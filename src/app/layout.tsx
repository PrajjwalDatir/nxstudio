import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.authorName, url: siteConfig.authorUrl }],
  creator: siteConfig.authorName,
  publisher: siteConfig.name,
  category: "technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    locale: siteConfig.locale,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — ${siteConfig.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    site: siteConfig.twitterHandle,
    creator: siteConfig.twitterHandle,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // nxstudio already ships its own dark theme, so tell Dark Reader to leave the
  // page alone. Without this the extension injects data-darkreader-* attributes
  // on <html> and every icon <svg> after SSR, tripping React hydration.
  other: { "darkreader-lock": "true" },
};

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
  colorScheme: "dark",
};

/**
 * JSON-LD structured data. Two graphs:
 *  - SoftwareApplication: what search engines + AI answer engines cite when a
 *    user asks "tool to turn an idea into a build prompt / tech stack".
 *  - WebSite: enables sitelinks + names the publisher.
 * Kept inline (not a component) so it renders in the initial SSR HTML that
 * crawlers read without executing JS.
 */
function StructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${siteConfig.url}/#app`,
        name: siteConfig.name,
        applicationCategory: "DeveloperApplication",
        applicationSubCategory: "AI product-building tool",
        operatingSystem: "Web",
        url: siteConfig.url,
        description: siteConfig.description,
        featureList: [
          "Turn a product brief into a derived tech stack",
          "Generate one production-ready build prompt for AI coding agents",
          "Track product phases from idea to ship",
        ],
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        author: {
          "@type": "Person",
          name: siteConfig.authorName,
          url: siteConfig.authorUrl,
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        publisher: {
          "@type": "Person",
          name: siteConfig.authorName,
          url: siteConfig.authorUrl,
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Trusted, statically-derived JSON — no user input reaches this string.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <StructuredData />
        {children}
      </body>
    </html>
  );
}
