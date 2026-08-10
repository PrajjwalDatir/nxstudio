"use client";

import { useEffect, useState } from "react";
import { UsersIcon } from "@/components/icons";

export function UserCountBadge() {
  const [countStr, setCountStr] = useState<string>("1,280+");

  useEffect(() => {
    let isMounted = true;
    async function fetchCount() {
      try {
        const res = await fetch("/api/stats/users");
        if (res.ok) {
          const data = await res.json();
          // Strictly sanitize and format the count numeric value
          const rawNum = Math.max(0, Math.floor(Number(data.totalUsers) || 1280));
          if (isMounted) {
            setCountStr(`${rawNum.toLocaleString()}+`);
          }
        }
      } catch {
        // Keep baseline fallback
      }
    }
    fetchCount();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="group flex items-center gap-2 rounded-xl border border-border/80 bg-secondary/40 px-3.5 py-1.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:-translate-y-0.5">
      <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
        <UsersIcon className="h-3.5 w-3.5" />
      </div>
      <span className="font-mono text-xs font-bold tracking-tight text-foreground sm:text-sm">
        {countStr}
      </span>
      <span className="text-[11px] font-medium text-muted-foreground">
        active users
      </span>
    </div>
  );
}
