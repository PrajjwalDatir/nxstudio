"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NxLogo, MenuIcon, XIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useAuthOverlay } from "./AuthOverlay";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#studio", label: "Studio" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
  { href: "#team", label: "Team" },
];

export function LandingNav() {
  const { open: openAuth } = useAuthOverlay();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 px-4 pt-3 sm:pt-4">
      <nav
        className={cn(
          "mx-auto flex h-14 max-w-4xl items-center justify-between rounded-full border pl-4 pr-2 transition-colors duration-300",
          scrolled || open
            ? "border-white/10 bg-background/70 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl"
            : "border-white/5 bg-background/40 backdrop-blur-md"
        )}
      >
        <Link href="/" className="flex items-center gap-2.5" aria-label="nxstudio home">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card">
            <NxLogo className="h-4 w-4 text-primary" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">nxstudio</span>
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-1 md:flex">
          <button
            onClick={() => openAuth()}
            className="rounded-full px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </button>
          <button
            onClick={() => openAuth()}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[0_0_0_1px_rgba(139,92,246,0.4),0_8px_24px_-12px_rgba(139,92,246,0.7)] transition-transform hover:-translate-y-0.5"
          >
            Start building
          </button>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile sheet */}
      {open && (
        <div className="mx-auto mt-2 max-w-4xl rounded-2xl border border-white/10 bg-background/95 backdrop-blur-xl md:hidden">
          <div className="px-4 py-4">
            <div className="flex flex-col gap-1">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {l.label}
                </a>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
              <button
                onClick={() => {
                  setOpen(false);
                  openAuth();
                }}
                className="rounded-lg border border-border px-4 py-2.5 text-center text-sm text-foreground"
              >
                Sign in
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  openAuth();
                }}
                className="rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground"
              >
                Start building
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
