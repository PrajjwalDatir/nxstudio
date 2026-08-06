"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CursorMark, ClaudeMark, WindsurfMark, V0Mark } from "./brand-icons";

const IDES = [
  {
    name: "Cursor",
    mark: CursorMark,
    iconColor: "text-white",
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
    name: "v0",
    mark: V0Mark,
    iconColor: "text-white",
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
    <span className="relative inline-block align-baseline [perspective:1000px] px-1">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={current.name}
          initial={{ rotateX: -90, opacity: 0, scale: 0.92, y: 14 }}
          animate={{ rotateX: 0, opacity: 1, scale: 1, y: 0 }}
          exit={{ rotateX: 90, opacity: 0, scale: 0.92, y: -14 }}
          transition={{
            type: "spring",
            stiffness: 320,
            damping: 24,
            mass: 0.8,
          }}
          className="inline-flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/[0.04] px-3.5 py-1 text-2xl font-bold tracking-tight text-foreground shadow-[0_8px_32px_-12px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.15)] backdrop-blur-xl sm:px-4 sm:py-1.5 sm:text-3xl md:text-4xl lg:text-[3.25rem] [transform-style:preserve-3d]"
        >
          <Icon className={`h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 shrink-0 ${current.iconColor}`} />
          <span className="text-white">{current.name}</span>
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
