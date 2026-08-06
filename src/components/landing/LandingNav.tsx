"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { NxLogo, MenuIcon, XIcon, SunIcon, MoonIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useAuthOverlay } from "./AuthOverlay";
import { runLightOnTransition, runDarkSnapTransition } from "./theme-transition";
import { lampOrigin } from "./lamp-origin";

// True once hydrated on the client, false during SSR — no effect-driven
// setState needed, so no cascading render on mount.
const noop = () => () => {};
function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}

function ThemeToggle() {
  const mounted = useMounted();
  const [theme, setTheme] = useState<"dark" | "light">(
    () => (typeof document !== "undefined" && document.documentElement.classList.contains("light") ? "light" : "dark")
  );
  const btnRef = useRef<HTMLButtonElement>(null);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;

    const applyThemeClass = () => {
      setTheme(next);
      localStorage.setItem("theme", next);
      if (next === "light") {
        root.classList.add("light");
      } else {
        root.classList.remove("light");
      }
    };

    if (next === "light") {
      // Eased crossfade as a fallback under the wave glow for browsers
      // without the View Transitions API.
      root.classList.add("theme-transitioning");
      setTimeout(() => root.classList.remove("theme-transitioning"), 900);

      // Start the light transition directly from the navbar light icon button
      const rect = btnRef.current?.getBoundingClientRect();
      const origin = rect
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        : { x: window.innerWidth - 40, y: 40 };
      runLightOnTransition(origin, applyThemeClass);
    } else {
      // No crossfade — the swap should read as an instant cut inside the flash.
      runDarkSnapTransition(applyThemeClass);
    }
  };

  if (!mounted) {
    return <div className="h-9 w-9 rounded-full border border-border/40 bg-card/40" />;
  }

  return (
    <button
      ref={btnRef}
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/60 text-foreground transition-all hover:bg-card hover:scale-105"
    >
      {theme === "dark" ? <SunIcon className="h-4 w-4 text-amber-300" /> : <MoonIcon className="h-4 w-4 text-indigo-500" />}
    </button>
  );
}

// Absolute (leading "/") so these still resolve correctly when this nav is
const LINKS = [
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "About" },
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
          "mx-auto flex h-14 max-w-4xl items-center justify-between rounded-full border pl-4 pr-2 transition-all duration-300 backdrop-blur-xl",
          scrolled || open
            ? "border-border/60 bg-card/80 shadow-sm"
            : "border-border/40 bg-card/50 shadow-sm"
        )}
      >
        <Link href="/" className="flex items-center gap-2" aria-label="nxstudio home">
          <NxLogo className="h-7 w-7 text-primary" />
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

        <div className="hidden items-center gap-2.5 md:flex">
          <ThemeToggle />
          <button
            onClick={() => {
              track("cta_click", { source: "nav", redirectTo: "/canvas" });
              openAuth();
            }}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 hover:opacity-90"
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
                  track("cta_click", { source: "nav_mobile", redirectTo: "/canvas" });
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
