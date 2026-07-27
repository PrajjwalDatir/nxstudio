"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GitHubSignIn } from "@/app/login/github-signin";
import { NxLogo, XIcon } from "@/components/icons";

/**
 * Sign-in as an overlay on the landing page.
 *
 * Dropping to a bare /login route threw away every bit of context the visitor
 * had just been reading. The overlay keeps the page — and the unit — behind it.
 *
 * /login still exists and still works: the proxy redirects unauthenticated
 * users there when they hit a protected route, and it's the target for direct
 * links and bookmarks. This is the entry point for people already on the
 * landing page, not a replacement for the route.
 *
 * The OAuth handoff itself is a real navigation to GitHub — that can't happen
 * in a modal — so this wraps the exact same GitHubSignIn component the route
 * uses. No duplicated auth logic, nothing to drift.
 */
const AuthContext = createContext<{ open: (redirectTo?: string) => void } | null>(null);

export function useAuthOverlay() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthOverlay must be used inside <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [redirectTo, setRedirectTo] = useState("/canvas");
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  const open = useCallback((to = "/canvas") => {
    restoreFocus.current = document.activeElement as HTMLElement;
    setRedirectTo(to);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    restoreFocus.current?.focus();
  }, []);

  // Escape to dismiss, and lock the page behind the overlay.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    // Move focus into the panel so keyboard users land inside the dialog.
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    }, 60);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
  }, [isOpen, close]);

  return (
    <AuthContext.Provider value={{ open }}>
      {children}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Scrim — the page stays visible behind it, just pushed back. */}
            <button
              aria-label="Close sign in"
              onClick={close}
              className="absolute inset-0 cursor-default bg-background/70 backdrop-blur-md"
            />

            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-title"
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.99 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="glass relative z-10 w-full max-w-sm rounded-2xl p-7 shadow-[0_40px_120px_-24px_rgba(0,0,0,0.9)]"
            >
              <button
                onClick={close}
                aria-label="Close"
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <XIcon className="h-4 w-4" />
              </button>

              <div className="flex flex-col items-center text-center">
                <NxLogo className="h-9 w-9 text-primary" />
                <h2 id="auth-title" className="mt-4 text-xl font-bold tracking-tight">
                  Let&apos;s get you building
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sign in and the unit takes it from there.
                </p>
              </div>

              <div className="mt-6">
                <GitHubSignIn redirectTo={redirectTo} />
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                By continuing you agree to the terms of service and privacy policy.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  );
}

/** Drop-in replacement for the old <Link href="/login"> CTAs. */
export function AuthButton({
  className,
  children,
  redirectTo = "/canvas",
  onMouseEnter,
}: {
  className?: string;
  children: ReactNode;
  redirectTo?: string;
  onMouseEnter?: () => void;
}) {
  const { open } = useAuthOverlay();
  return (
    <button className={className} onClick={() => open(redirectTo)} onMouseEnter={onMouseEnter}>
      {children}
    </button>
  );
}
