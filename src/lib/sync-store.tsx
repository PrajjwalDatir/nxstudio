"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  GitHubStatus,
  SyncResult,
  connectGitHub as apiConnect,
  disconnectGitHub as apiDisconnect,
  getGitHubStatus,
  syncRepo,
} from "./github-client";
import { useWorkspace } from "./workspace-store";

export type SyncStatus =
  | "checking" // verifying GitHub connection
  | "disconnected" // no GitHub token
  | "no-repo" // connected but active project has no repo
  | "syncing"
  | "ok"
  | "error";

interface SyncContextType {
  github: GitHubStatus;
  status: SyncStatus;
  result: SyncResult | null;
  lastSyncedAt: string | null;
  error: string | null;
  connect: (token: string) => Promise<void>;
  disconnect: () => Promise<void>;
  sync: () => Promise<void>;
}

const Ctx = createContext<SyncContextType | null>(null);

export function useSync() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSync must be used within SyncProvider");
  return c;
}

const POLL_MS = 60_000;

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { github: connection } = useWorkspace();
  const repo = connection.repo;
  const branch = connection.branch;

  const [github, setGithub] = useState<GitHubStatus>({ connected: false });
  const [status, setStatus] = useState<SyncStatus>("checking");
  const [resultByRepo, setResultByRepo] = useState<Record<string, SyncResult>>({});
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const result = repo ? resultByRepo[repo] ?? null : null;
  const lastSyncedAt = result?.syncedAt ?? null;

  // Verify GitHub connection on mount.
  useEffect(() => {
    let alive = true;
    getGitHubStatus().then((s) => {
      if (!alive) return;
      setGithub(s);
      setStatus(s.connected ? (repo ? "ok" : "no-repo") : "disconnected");
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = useCallback(async () => {
    if (!github.connected) {
      setStatus("disconnected");
      return;
    }
    if (!repo) {
      setStatus("no-repo");
      return;
    }
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus("syncing");
    setError(null);
    try {
      const r = await syncRepo(repo, branch);
      setResultByRepo((prev) => ({ ...prev, [repo]: r }));
      setStatus("ok");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed.");
      setStatus("error");
    } finally {
      inFlight.current = false;
    }
  }, [github.connected, repo, branch]);

  // Sync when repo/connection changes, then poll.
  useEffect(() => {
    if (!github.connected) {
      setStatus("disconnected");
      return;
    }
    if (!repo) {
      setStatus("no-repo");
      return;
    }
    sync();
    const id = setInterval(sync, POLL_MS);
    return () => clearInterval(id);
  }, [github.connected, repo, branch, sync]);

  const connect = useCallback(async (token: string) => {
    const s = await apiConnect(token);
    setGithub(s);
    setStatus(s.connected ? (repo ? "syncing" : "no-repo") : "disconnected");
  }, [repo]);

  const disconnect = useCallback(async () => {
    await apiDisconnect();
    setGithub({ connected: false });
    setStatus("disconnected");
    setResultByRepo({});
  }, []);

  return (
    <Ctx.Provider
      value={{ github, status, result, lastSyncedAt, error, connect, disconnect, sync }}
    >
      {children}
    </Ctx.Provider>
  );
}
