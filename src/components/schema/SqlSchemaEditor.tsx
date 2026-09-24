"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ProductSchema, SchemaTable, SchemaRelation } from "@/lib/types";
import { parseSqlToSchema, formatSql, SqlDiagnostic } from "@/lib/sql-parser";
import {
  CheckIcon,
  CopyIcon,
  SparklesIcon,
  FileTextIcon,
  RotateCcwIcon,
  SaveIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

interface SqlSchemaEditorProps {
  initialSql: string;
  tables: SchemaTable[];
  relations: SchemaRelation[];
  onApplySchema: (newSchema: ProductSchema) => void;
  onResetFromErd: () => string;
  isMaximized?: boolean;
  className?: string;
}

export function SqlSchemaEditor({
  initialSql,
  tables,
  relations,
  onApplySchema,
  onResetFromErd,
  isMaximized = false,
  className,
}: SqlSchemaEditorProps) {
  const [sql, setSql] = useState(initialSql);
  const [lastSavedSql, setLastSavedSql] = useState(initialSql);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "error" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<SqlDiagnostic[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Sync internal state when external initialSql changes
  useEffect(() => {
    setSql(initialSql);
    setLastSavedSql(initialSql);
    setDiagnostics([]);
    setErrorMessage(null);
    setSaveStatus(null);
  }, [initialSql]);

  const isDirty = sql !== lastSavedSql;

  // Synchronize scroll between textarea and line numbers gutter
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Map diagnostics by line number for gutter (only populated when Save fails)
  const diagnosticsByLine = useMemo(() => {
    const map = new Map<number, SqlDiagnostic[]>();
    for (const d of diagnostics) {
      if (d.line) {
        const existing = map.get(d.line) || [];
        existing.push(d);
        map.set(d.line, existing);
      }
    }
    return map;
  }, [diagnostics]);

  // Calculate line count for gutter (simple line split, fast & zero AST compute)
  const lineCount = useMemo(() => {
    const lines = sql.split("\n").length;
    return Math.max(lines, 1);
  }, [sql]);

  // Jump to specific line in textarea
  const jumpToLine = useCallback(
    (lineNumber: number) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const lines = sql.split("\n");
      let charPos = 0;
      for (let i = 0; i < Math.min(lineNumber - 1, lines.length); i++) {
        charPos += lines[i].length + 1;
      }
      textarea.focus();
      textarea.setSelectionRange(
        charPos,
        charPos + (lines[lineNumber - 1]?.length || 0)
      );
      textarea.scrollTop = Math.max(0, (lineNumber - 5) * 21);
    },
    [sql]
  );

  // Save handler: runs in-browser DDL parser and validation engine strictly on Save
  const handleSave = useCallback(() => {
    setIsSaving(true);
    setErrorMessage(null);

    // Compute DDL parsing & validation ONCE on Save (not on keystrokes)
    const res = parseSqlToSchema(sql, tables, relations);
    setLastSavedSql(sql);

    if (!res.isValid) {
      // Syntax or relational errors detected
      setDiagnostics(res.diagnostics);
      setSaveStatus("error");
      const firstErr = res.diagnostics.find((d) => d.severity === "error");
      setErrorMessage(
        firstErr?.line
          ? `Line ${firstErr.line}: ${firstErr.message}`
          : "Invalid SQL syntax. Please fix errors to update tables."
      );
      // Keep canvas protected, save raw customSql
      onApplySchema({
        tables,
        relations,
        customSql: sql,
      });
      setTimeout(() => setIsSaving(false), 80);
      return;
    }

    // Valid: Clear any previous errors, push tables to visual canvas
    setDiagnostics([]);
    setSaveStatus("saved");
    onApplySchema({
      tables: res.schema.tables,
      relations: res.schema.relations,
      customSql: sql,
    });

    setTimeout(() => {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 2200);
    }, 80);
  }, [sql, tables, relations, onApplySchema]);

  // Tab key and auto-indent handling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Save shortcut: Ctrl+S or Cmd+S
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      handleSave();
      return;
    }

    // Tab key: Insert 2 spaces or indent/unindent
    if (e.key === "Tab") {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      if (e.shiftKey) {
        // Shift+Tab: Unindent
        const beforeStart = value.substring(0, start);
        const lastNewline = beforeStart.lastIndexOf("\n");
        const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
        const linePrefix = value.substring(lineStart, lineStart + 2);

        if (linePrefix === "  ") {
          const newValue =
            value.substring(0, lineStart) + value.substring(lineStart + 2);
          setSql(newValue);
          setTimeout(() => {
            textarea.selectionStart = Math.max(lineStart, start - 2);
            textarea.selectionEnd = Math.max(lineStart, end - 2);
          }, 0);
        }
      } else {
        // Tab: Insert 2 spaces
        const newValue =
          value.substring(0, start) + "  " + value.substring(end);
        setSql(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }
      return;
    }

    // Auto-indent on Enter
    if (e.key === "Enter") {
      const start = textarea.selectionStart;
      const value = textarea.value;
      const beforeCursor = value.substring(0, start);
      const lastLine = beforeCursor.split("\n").pop() || "";
      const match = lastLine.match(/^(\s+)/);

      if (match) {
        e.preventDefault();
        const indent = match[1];
        const extraIndent = lastLine.trim().endsWith("(") ? "  " : "";
        const nextIndent = "\n" + indent + extraIndent;

        const newValue =
          value.substring(0, start) + nextIndent + value.substring(start);
        setSql(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd =
            start + nextIndent.length;
        }, 0);
      }
    }
  };

  // Format SQL
  const handleFormat = () => {
    const formatted = formatSql(sql);
    setSql(formatted);
  };

  // Reset to ERD compiled SQL
  const handleReset = () => {
    const regenerated = onResetFromErd();
    setSql(regenerated);
    setLastSavedSql(regenerated);
    setDiagnostics([]);
    setErrorMessage(null);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus(null), 1800);
  };

  // Copy code
  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
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
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/30 px-3 sm:px-4 py-2">
        <div className="flex items-center gap-2">
          <FileTextIcon className="h-4 w-4 text-lilac shrink-0" />
          <span className="font-mono text-xs font-semibold text-foreground">
            .nx/db/schema.sql
          </span>

          {isDirty && (
            <span
              className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0"
              title="Unsaved changes"
            />
          )}

          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 animate-in fade-in duration-100">
              <CheckIcon className="h-3 w-3" />
              Saved & tables updated
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Format */}
          <button
            type="button"
            onClick={handleFormat}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:border-lilac/40 transition-colors"
            title="Format SQL indentation & keywords"
          >
            <SparklesIcon className="h-3 w-3 text-lilac" />
            <span>Format</span>
          </button>

          {/* Regenerate from Canvas */}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
            title="Regenerate SQL from canvas"
          >
            <RotateCcwIcon className="h-3 w-3" />
            <span className="hidden sm:inline">Regenerate</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all shadow-xs",
              isDirty
                ? "bg-lilac text-white hover:bg-lilac/90 shadow-md shadow-lilac/25 active:scale-95"
                : saveStatus === "error"
                ? "border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                : "border border-lilac/40 bg-lilac/10 text-lilac hover:bg-lilac/20"
            )}
            title="Save changes and update canvas tables (⌘S)"
          >
            <SaveIcon className={cn("h-3.5 w-3.5", isSaving && "animate-spin")} />
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

          {/* Copy */}
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

      {/* Single Clean Error Banner (Only shown if Save finds syntax errors) */}
      {errorMessage && (
        <div className="flex items-center justify-between border-b border-red-500/20 bg-red-500/10 px-3 sm:px-4 py-1.5 text-xs text-red-300 font-mono">
          <span className="truncate">{errorMessage}</span>
          {diagnostics[0]?.line && (
            <button
              type="button"
              onClick={() => jumpToLine(diagnostics[0].line!)}
              className="text-xs text-red-400 hover:text-red-200 underline shrink-0 ml-2"
            >
              Jump to line {diagnostics[0].line} →
            </button>
          )}
        </div>
      )}

      {/* Editor Body */}
      <div
        className={cn(
          "relative flex w-full bg-background/90 text-foreground overflow-hidden font-mono text-xs transition-all",
          isMaximized
            ? "flex-1 h-full min-h-[400px]"
            : "h-[620px] lg:h-[calc(100vh-310px)] min-h-[500px]"
        )}
      >
        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          aria-hidden="true"
          className="w-10 sm:w-12 select-none overflow-hidden border-r border-border/40 bg-secondary/10 py-3 text-right pr-2 text-muted-foreground/40 font-mono leading-relaxed"
        >
          {Array.from({ length: lineCount }).map((_, i) => {
            const lineNum = i + 1;
            const hasError = diagnosticsByLine.has(lineNum);

            return (
              <div
                key={i}
                onClick={() => jumpToLine(lineNum)}
                className={cn(
                  "h-[21px] flex items-center justify-end px-1 transition-colors cursor-pointer",
                  hasError
                    ? "text-red-400 font-bold bg-red-500/15"
                    : "text-muted-foreground/40 hover:text-muted-foreground"
                )}
              >
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Code Textarea */}
        <textarea
          ref={textareaRef}
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          placeholder="-- Write or paste PostgreSQL / SQLite DDL schema here...&#10;CREATE TABLE users (&#10;  id UUID PRIMARY KEY,&#10;  email VARCHAR(255) NOT NULL UNIQUE&#10;);"
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
        <span>Press <kbd className="rounded border border-border px-1 py-0.5 text-[10px] bg-secondary/60">⌘S</kbd> to save & update tables</span>
      </div>
    </div>
  );
}
