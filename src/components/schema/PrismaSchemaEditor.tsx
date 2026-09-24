"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ProductSchema } from "@/lib/types";
import {
  CheckIcon,
  CopyIcon,
  RotateCcwIcon,
  FileTextIcon,
  SaveIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

interface PrismaSchemaEditorProps {
  initialPrisma: string;
  onApplyPrisma: (newSchema: ProductSchema) => void;
  onResetFromErd: () => string;
  currentSchema: ProductSchema;
  isMaximized?: boolean;
  className?: string;
}

export function PrismaSchemaEditor({
  initialPrisma,
  onApplyPrisma,
  onResetFromErd,
  currentSchema,
  isMaximized = false,
  className,
}: PrismaSchemaEditorProps) {
  const [prismaCode, setPrismaCode] = useState(initialPrisma);
  const [lastSavedCode, setLastSavedCode] = useState(initialPrisma);
  const [copied, setCopied] = useState(false);
  const [syncedFeedback, setSyncedFeedback] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPrismaCode(initialPrisma);
    setLastSavedCode(initialPrisma);
  }, [initialPrisma]);

  const isDirty = prismaCode !== lastSavedCode;

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const lineCount = useMemo(() => {
    const lines = prismaCode.split("\n").length;
    return Math.max(lines, 1);
  }, [prismaCode]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      saveChanges();
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      if (e.shiftKey) {
        const beforeStart = value.substring(0, start);
        const lastNewline = beforeStart.lastIndexOf("\n");
        const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
        const linePrefix = value.substring(lineStart, lineStart + 2);

        if (linePrefix === "  ") {
          const newValue =
            value.substring(0, lineStart) + value.substring(lineStart + 2);
          setPrismaCode(newValue);
          setTimeout(() => {
            textarea.selectionStart = Math.max(lineStart, start - 2);
            textarea.selectionEnd = Math.max(lineStart, end - 2);
          }, 0);
        }
      } else {
        const newValue =
          value.substring(0, start) + "  " + value.substring(end);
        setPrismaCode(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }
      return;
    }

    if (e.key === "Enter") {
      const start = textarea.selectionStart;
      const value = textarea.value;
      const beforeCursor = value.substring(0, start);
      const lastLine = beforeCursor.split("\n").pop() || "";
      const match = lastLine.match(/^(\s+)/);

      if (match) {
        e.preventDefault();
        const indent = match[1];
        const extraIndent = lastLine.trim().endsWith("{") ? "  " : "";
        const nextIndent = "\n" + indent + extraIndent;

        const newValue =
          value.substring(0, start) + nextIndent + value.substring(start);
        setPrismaCode(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd =
            start + nextIndent.length;
        }, 0);
      }
    }
  };

  const saveChanges = () => {
    onApplyPrisma({
      ...currentSchema,
      customPrisma: prismaCode,
    });
    setLastSavedCode(prismaCode);
    setSyncedFeedback(true);
    setTimeout(() => setSyncedFeedback(false), 2000);
  };

  const handleReset = () => {
    const regenerated = onResetFromErd();
    setPrismaCode(regenerated);
    setLastSavedCode(regenerated);
    onApplyPrisma({
      ...currentSchema,
      customPrisma: undefined,
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(prismaCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      className={cn(
        "relative mt-4 flex flex-col rounded-xl border border-border bg-card/60 shadow-sm overflow-hidden transition-all",
        isMaximized && "flex-1 h-full min-h-0 mt-3 border-border/80 shadow-md",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/30 px-3 sm:px-4 py-2">
        <div className="flex items-center gap-2">
          <FileTextIcon className="h-4 w-4 text-lilac shrink-0" />
          <span className="font-mono text-xs font-semibold text-foreground">
            .nx/db/schema.prisma
          </span>

          {isDirty && (
            <span
              className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0"
              title="Unsaved changes"
            />
          )}

          {syncedFeedback && (
            <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 animate-in fade-in duration-100">
              <CheckIcon className="h-3 w-3" />
              Saved & schema updated
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
            title="Regenerate clean schema from visual ERD"
          >
            <RotateCcwIcon className="h-3 w-3" />
            <span className="hidden sm:inline">Regenerate</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={saveChanges}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all shadow-xs",
              isDirty
                ? "bg-lilac text-white hover:bg-lilac/90 shadow-md shadow-lilac/25 active:scale-95"
                : "border border-lilac/40 bg-lilac/10 text-lilac hover:bg-lilac/20"
            )}
            title="Save custom Prisma schema (⌘S)"
          >
            <SaveIcon className="h-3.5 w-3.5" />
            <span>Save</span>
            <kbd
              className={cn(
                "hidden sm:inline-block rounded px-1 py-0.2 text-[9px] font-mono",
                isDirty ? "bg-black/20 text-white" : "bg-black/10 text-lilac"
              )}
            >
              ⌘S
            </kbd>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:border-primary/40 transition-colors"
          >
            {copied ? (
              <CheckIcon className="h-3 w-3 text-emerald-400" />
            ) : (
              <CopyIcon className="h-3 w-3" />
            )}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      <div
        className={cn(
          "relative flex w-full bg-background/90 text-foreground overflow-hidden font-mono text-xs transition-all",
          isMaximized
            ? "flex-1 h-full min-h-[400px]"
            : "h-[620px] lg:h-[calc(100vh-310px)] min-h-[500px]"
        )}
      >
        <div
          ref={lineNumbersRef}
          aria-hidden="true"
          className="w-10 sm:w-12 select-none overflow-hidden border-r border-border/40 bg-secondary/10 py-3 text-right pr-2.5 text-muted-foreground/40 font-mono leading-relaxed"
        >
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i} className="h-[21px]">
              {i + 1}
            </div>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={prismaCode}
          onChange={(e) => setPrismaCode(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          placeholder="// Write or customize Prisma models here...&#10;model User {&#10;  id    String @id @default(uuid())&#10;  email String @unique&#10;}"
          className="flex-1 resize-none bg-transparent p-3 font-mono text-xs text-foreground/90 leading-relaxed outline-none focus:outline-none focus:ring-0 border-0 overflow-auto whitespace-pre selection:bg-lilac/30"
          style={{
            lineHeight: "21px",
            tabSize: 2,
          }}
        />
      </div>

      {/* Minimal Clean Footer */}
      <div className="flex items-center justify-between border-t border-border/80 bg-secondary/20 px-3 sm:px-4 py-1.5 text-[11px] text-muted-foreground font-mono">
        <span>{lineCount} lines</span>
        <span>Press <kbd className="rounded border border-border px-1 py-0.5 text-[10px] bg-secondary/60">⌘S</kbd> to save & update schema</span>
      </div>
    </div>
  );
}
