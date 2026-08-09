"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/phases/CopyButton";
import { LoaderIcon, CheckCircleIcon, ZapIcon } from "@/components/icons";

const SUPPORT_EMAIL = "in.prajj@gmail.com";

interface PayRequest {
  reference: string;
  url: string;
  amount: string;
  tier: string;
  wallet: string;
  cycleDays: number;
}

type Phase = "idle" | "requesting" | "awaiting" | "verifying";

export function CryptoCheckout({
  onActivated,
}: {
  onActivated?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [req, setReq] = useState<PayRequest | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [needsSupport, setNeedsSupport] = useState(false);

  useEffect(() => {
    if (!req?.url) return;
    QRCode.toDataURL(req.url, { margin: 1, width: 220 })
      .then(setQr)
      .catch(() => setQr(null));
  }, [req?.url]);

  const start = useCallback(async () => {
    setPhase("requesting");
    setNote(null);
    setNeedsSupport(false);
    try {
      const res = await fetch("/api/billing/crypto/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't start the payment.");
      setReq(data as PayRequest);
      setPhase("awaiting");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("idle");
    }
  }, []);

  const verify = useCallback(async () => {
    setPhase("verifying");
    setNote(null);
    setNeedsSupport(false);
    try {
      const res = await fetch("/api/billing/crypto/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: req?.reference }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Verification failed.");

      if (data.verified) {
        setNote("Payment confirmed — access activated.");
        onActivated?.();
        return;
      }
      if (data.reason === "not_found") {
        setNote("We haven't seen the payment finalize yet. Give it a few seconds and try again.");
      } else {
        setNote(data.message ?? "That payment couldn't be validated.");
        setNeedsSupport(true);
      }
      setPhase("awaiting");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Verification failed.");
      setPhase("awaiting");
    }
  }, [req, onActivated]);

  if (phase === "idle" || phase === "requesting") {
    return (
      <div className="space-y-4">
        <Button onClick={() => start()} disabled={phase === "requesting"} className="w-full gap-2 font-mono text-xs uppercase">
          {phase === "requesting" ? (
            <LoaderIcon className="h-4 w-4 animate-spin" />
          ) : (
            <ZapIcon className="h-4 w-4" />
          )}
          {phase === "requesting" ? "Preparing..." : "Pay 10 USDT with Solana Pay"}
        </Button>
        {note && <p className="text-sm text-red-400">{note}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-start">
        {qr ? (
          <Image src={qr} alt="Solana Pay QR" width={160} height={160} className="rounded-lg" unoptimized />
        ) : (
          <div className="flex h-40 w-40 items-center justify-center rounded-lg bg-secondary">
            <LoaderIcon className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-2 text-sm">
          <p className="text-muted-foreground">
            Send <span className="font-semibold text-foreground">{req?.amount} USDC/USDT</span> on
            Solana for a {req?.cycleDays}-day cycle. Scan with Phantom or any Solana wallet.
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-secondary/40 p-2">
            <span className="truncate font-mono text-xs">{req?.wallet}</span>
            <CopyButton value={req?.wallet ?? ""} className="shrink-0" />
          </div>
          <a
            href={req?.url}
            className="inline-block text-xs font-medium text-accent-foreground hover:underline"
          >
            Open in wallet →
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={verify} disabled={phase === "verifying"} className="gap-2">
          {phase === "verifying" && <LoaderIcon className="h-4 w-4 animate-spin" />}
          {phase === "verifying" ? "Checking the chain…" : "I've paid"}
        </Button>
        <Button variant="ghost" onClick={verify} disabled={phase === "verifying"}>
          {"I've already paid"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setPhase("idle")} className="ml-auto text-xs">
          Switch Plan
        </Button>
      </div>

      {note && (
        <div
          className={
            needsSupport
              ? "rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-400"
              : "flex items-center gap-2 text-sm text-muted-foreground"
          }
        >
          {!needsSupport && note.includes("confirmed") && (
            <CheckCircleIcon className="h-4 w-4 text-emerald-400" />
          )}
          <span>
            {note}
            {needsSupport && (
              <>
                {" "}
                Contact{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
                  {SUPPORT_EMAIL}
                </a>{" "}
                with your reference{" "}
                <span className="font-mono text-xs">{req?.reference.slice(0, 8)}…</span>
              </>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
