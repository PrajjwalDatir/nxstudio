import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";

// about/page.tsx is a client component (it drives scroll-linked motion), so
// metadata can't live there directly — Next.js only reads `metadata` exports
// from Server Components. This layout carries it instead.
export const metadata: Metadata = pageMetadata({
  path: "/about",
  title: "About",
  description:
    "Nx Studio compiles raw product vision into precise, self-contained architecture bundles so AI coding agents can build with absolute context.",
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
