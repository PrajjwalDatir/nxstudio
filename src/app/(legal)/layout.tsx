import Link from "next/link";
import { NxLogo, ArrowLeftIcon } from "@/components/icons";
import { LegalSidebar } from "./LegalSidebar";
import { SiteFooter } from "@/components/landing/SiteFooter";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label="nxstudio home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card">
              <NxLogo className="h-4 w-4 text-primary" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">nxstudio</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back home
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-5 py-14 md:flex-row sm:px-6 sm:py-20">
        <aside className="w-full md:w-56 shrink-0">
          <LegalSidebar />
        </aside>
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
