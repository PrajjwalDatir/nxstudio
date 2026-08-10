"use client";

import { useEffect, useState } from "react";
import { UsersIcon } from "@/components/icons";

export function UserCountBadge() {
  const [countStr, setCountStr] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchCount() {
      try {
        const res = await fetch("/api/stats/users");
        if (res.ok) {
          const data = await res.json();
          // Format authentic real total user count from Supabase
          const rawNum = Math.max(0, Math.floor(Number(data.totalUsers) || 0));
          if (isMounted) {
            setCountStr(rawNum.toLocaleString());
          }
        }
      } catch {
        if (isMounted) setCountStr("0");
      }
    }
    fetchCount();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="group flex items-center gap-2 rounded-xl border border-border/80 bg-secondary/40 px-3.5 py-1.5 text-sm font-semibold text-foreground shadow-sm transition-all">
      <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary transition-colors group-hover:bg-primary/20">
        <UsersIcon className="h-3.5 w-3.5" />
      </div>
      <span className="font-mono text-xs font-bold tracking-tight text-foreground sm:text-sm">
        {countStr === null ? "..." : countStr}
      </span>
      <span className="text-[11px] font-medium text-muted-foreground">
        users
      </span>
    </div>
  );
}
