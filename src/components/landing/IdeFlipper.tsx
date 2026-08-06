"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CursorMark, ClaudeMark, WindsurfMark, V0Mark } from "./brand-icons";

const IDES = [
  {
    name: "Cursor",
    mark: CursorMark,
    iconColor: "text-foreground",
  },
  {
    name: "Claude Code",
    mark: ClaudeMark,
    iconColor: "text-[#D97757]",
  },
  {
    name: "Windsurf",
    mark: WindsurfMark,
    iconColor: "text-[#00D2FF]",
  },
  {
    name: "v0 by Vercel",
    mark: V0Mark,
    iconColor: "text-foreground",
  },
];

export function IdeFlipper() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % IDES.length);
    }, 2800);

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
            stiffness: 360,
            damping: 26,
            mass: 0.7,
          }}
          className="inline-flex items-center gap-2.5 rounded-2xl border border-border/80 bg-card/80 px-3.5 py-1 text-foreground shadow-sm backdrop-blur-md transition-colors align-baseline"
        >
          <Icon className={`h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 shrink-0 ${current.iconColor}`} />
          <span className="font-extrabold text-foreground">{current.name}</span>
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
