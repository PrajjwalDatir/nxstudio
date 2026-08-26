"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CursorMark, ClaudeMark, WindsurfMark, V0Mark, ProductHuntMark } from "./brand-icons";

const IDES = [
  {
    name: "Cursor",
    label: "Cursor",
    mark: CursorMark,
    iconColor: "text-foreground",
  },
  {
    name: "Claude Code",
    label: "Claude Code",
    mark: ClaudeMark,
    iconColor: "text-[#D97757]",
  },
  {
    name: "Windsurf",
    label: "Windsurf",
    mark: WindsurfMark,
    iconColor: "text-[#00D2FF]",
  },
  {
    name: "v0 by Vercel",
    label: "by Vercel",
    mark: V0Mark,
    iconColor: "text-foreground",
  },
];

export function IdeFlipper() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % IDES.length);
    }, 4200);

    return () => clearInterval(timer);
  }, []);

  const current = IDES[index];
  const Icon = current.mark;

  return (
    <span className="relative inline-flex align-baseline [perspective:1000px] mx-1 sm:mx-2">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={current.name}
          initial={{ rotateX: -90, opacity: 0, scale: 0.95, y: 8 }}
          animate={{ rotateX: 0, opacity: 1, scale: 1, y: 0 }}
          exit={{ rotateX: 90, opacity: 0, scale: 0.95, y: -8 }}
          transition={{
            type: "spring",
            stiffness: 170,
            damping: 24,
            mass: 1,
          }}
          className="inline-flex items-center gap-2.5 rounded-2xl border border-border/80 bg-card/80 px-3.5 py-1 text-foreground shadow-sm backdrop-blur-md transition-colors align-baseline"
        >
          <Icon className={`h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 shrink-0 ${current.iconColor}`} />
          <span className="text-[0.82em] font-extrabold text-foreground">{current.label}</span>
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function IdeBadgeFlipper() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % IDES.length);
    }, 3600);

    return () => clearInterval(timer);
  }, []);

  const current = IDES[index];
  const Icon = current.mark;

  return (
    <div className="relative inline-flex h-10 items-center justify-center min-w-[150px] [perspective:1000px]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current.name}
          initial={{ rotateX: -90, opacity: 0, scale: 0.95, y: 6 }}
          animate={{ rotateX: 0, opacity: 1, scale: 1, y: 0 }}
          exit={{ rotateX: 90, opacity: 0, scale: 0.95, y: -6 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 22,
            mass: 0.9,
          }}
          className="group flex items-center gap-2 rounded-xl border border-border/80 bg-secondary/40 px-3.5 py-1.5 text-sm font-semibold text-foreground shadow-sm transition-all"
        >
          <Icon className={`h-4 w-4 shrink-0 ${current.iconColor}`} />
          <span className="font-semibold text-foreground text-xs sm:text-sm">{current.name}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const LAUNCHES = [
  {
    type: "image",
    name: "Launchstag",
    href: "https://launchstag.com",
    lightImg: "https://launchstag.com/badge-light.svg",
    darkImg: "https://launchstag.com/badge-dark.svg",
    alt: "Featured on Launchstag",
    width: 198,
    height: 62,
  },
  {
    type: "custom",
    name: "Product Hunt",
    href: "https://www.producthunt.com",
    Icon: ProductHuntMark,
    label: "Product Hunt",
    accent: "text-[#FF6154]",
  },
  {
    type: "image",
    name: "Launchpadly",
    href: "https://launchpadly.co/startup/nxstudio?ref=badge",
    lightImg: "https://launchpadly.co/embed/badges/startup/nxstudio.svg?variant=compact",
    darkImg: "https://launchpadly.co/embed/badges/startup/nxstudio.svg?variant=compact",
    alt: "nxstudio - Launchpadly Startup Directory",
    width: 200,
    height: 36,
  },
];

export function LaunchBadgeFlipper() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % LAUNCHES.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const current = LAUNCHES[index];

  return (
    <div className="relative inline-flex h-10 items-center justify-center min-w-[150px] [perspective:1000px]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current.name}
          initial={{ rotateX: -90, opacity: 0, scale: 0.95, y: 6 }}
          animate={{ rotateX: 0, opacity: 1, scale: 1, y: 0 }}
          exit={{ rotateX: 90, opacity: 0, scale: 0.95, y: -6 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 22,
            mass: 0.9,
          }}
        >
          {current.type === "image" ? (
            <a
              href={current.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 transition-transform hover:-translate-y-0.5"
            >
              {/* Light mode badge */}
              <img
                src={current.lightImg}
                alt={current.alt}
                width={current.width}
                height={current.height}
                className="h-9 w-auto dark:hidden"
              />
              {/* Dark mode badge */}
              <img
                src={current.darkImg}
                alt={current.alt}
                width={current.width}
                height={current.height}
                className="hidden h-9 w-auto dark:block"
              />
            </a>
          ) : (
            <a
              href={current.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-xl border border-border/80 bg-secondary/40 px-3.5 py-1.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:-translate-y-0.5"
            >
              {current.Icon && <current.Icon className={`h-4 w-4 shrink-0 ${current.accent}`} />}
              <span className="font-semibold text-foreground text-xs sm:text-sm">{current.name}</span>
            </a>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
