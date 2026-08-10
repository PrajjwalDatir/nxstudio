"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UsersIcon, FolderIcon } from "@/components/icons";

function GlobeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

interface CommunityStats {
  totalUsers: number;
  totalWorkspaces: number;
  totalVisitors: number;
}

export function UserCountBadge() {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [metricIndex, setMetricIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats/users");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setStats({
              totalUsers: Math.max(0, Math.floor(Number(data.totalUsers) || 0)),
              totalWorkspaces: Math.max(0, Math.floor(Number(data.totalWorkspaces) || 0)),
              totalVisitors: Math.max(0, Math.floor(Number(data.totalVisitors) || 0)),
            });
          }
        }
      } catch {
        if (isMounted) {
          setStats({ totalUsers: 0, totalWorkspaces: 0, totalVisitors: 0 });
        }
      }
    }
    fetchStats();
    return () => {
      isMounted = false;
    };
  }, []);

  // Cycle through the 3 database metrics automatically every 3.8s
  useEffect(() => {
    const timer = setInterval(() => {
      setMetricIndex((prev) => (prev + 1) % 3);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const metrics = [
    {
      id: "users",
      label: "registered users",
      count: stats ? stats.totalUsers : null,
      Icon: UsersIcon,
      accent: "text-primary bg-primary/10",
    },
    {
      id: "workspaces",
      label: "workspaces",
      count: stats ? stats.totalWorkspaces : null,
      Icon: FolderIcon,
      accent: "text-amber-500 bg-amber-500/10 dark:text-amber-400",
    },
    {
      id: "visitors",
      label: "total visitors",
      count: stats ? stats.totalVisitors : null,
      Icon: GlobeIcon,
      accent: "text-emerald-500 bg-emerald-500/10 dark:text-emerald-400",
    },
  ];

  const current = metrics[metricIndex];
  const Icon = current.Icon;

  return (
    <div className="relative inline-flex h-10 items-center justify-center min-w-[165px] [perspective:1000px]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current.id}
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
          <div className={`flex h-5 w-5 items-center justify-center rounded-lg transition-colors ${current.accent}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="font-mono text-xs font-bold tracking-tight text-foreground sm:text-sm">
            {current.count === null ? "..." : current.count.toLocaleString()}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            {current.label}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
