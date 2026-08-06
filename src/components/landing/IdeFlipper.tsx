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
          initial={{ rotateX: -90, opacity: 0, scale: 0.95, y: 8 }}
          animate={{ rotateX: 0, opacity: 1, scale: 1, y: 0 }}
          exit={{ rotateX: 90, opacity: 0, scale: 0.95, y: -8 }}
          transition={{
            type: "spring",
            stiffness: 360,
            damping: 26,
            mass: 0.7,
          }}
          className="inline-flex items-center gap-2 sm:gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-2xl font-extrabold tracking-tight text-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.12)] backdrop-blur-xl sm:px-3 sm:text-3xl md:text-4xl lg:text-[3.25rem] [transform-style:preserve-3d] align-baseline"
        >
          <Icon className={`h-5 w-5 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 shrink-0 ${current.iconColor}`} />
          <span className="text-white">{current.name}</span>
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
