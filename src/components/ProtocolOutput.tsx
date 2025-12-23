"use client";

import { useProtocol } from "@/lib/protocol-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Terminal, Download, FileCode2 } from "lucide-react";
import { useState, useCallback, useEffect } from "react";

export function ProtocolOutput() {
  const { compiledProtocol, data } = useProtocol();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(compiledProtocol);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [compiledProtocol]);

  const handleDownload = useCallback(() => {
    const fileName = data.name 
      ? `${data.name.toLowerCase().replace(/\s+/g, "-")}-protocol.md`
      : "cog-protocol.md";
    
    const blob = new Blob([compiledProtocol], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, [compiledProtocol, data.name]);

  // Keyboard shortcut: Cmd/Ctrl + C when focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "c") {
        e.preventDefault();
        handleCopy();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "s") {
        e.preventDefault();
        handleDownload();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCopy, handleDownload]);

  const lineCount = compiledProtocol.split("\n").length;
  const isComplete = data.name && data.mission && data.stack;

  return (
    <TooltipProvider delayDuration={300}>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="h-full flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-white">Protocol Output</h2>
            <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
              {lineCount} lines
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  disabled={!isComplete}
                  className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Download as .md <kbd className="ml-1 text-xs opacity-60">⇧⌘S</kbd>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-1.5 h-8 border-zinc-700 hover:border-primary hover:bg-primary/10 transition-all"
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="flex items-center gap-1.5 text-green-500"
                      >
                        <Check className="h-4 w-4" />
                        <span>Copied!</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="flex items-center gap-1.5"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Copy</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Copy to clipboard <kbd className="ml-1 text-xs opacity-60">⇧⌘C</kbd>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Terminal Window */}
        <div className="flex-1 terminal-output rounded-lg overflow-hidden flex flex-col">
          {/* Terminal Chrome */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/50">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors" />
              <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors" />
            </div>
            <div className="flex-1 flex items-center justify-center gap-2">
              <FileCode2 className="h-3.5 w-3.5 text-zinc-600" />
              <span className="text-xs text-zinc-500 font-mono">
                {data.name ? `${data.name.toLowerCase().replace(/\s+/g, "-")}-protocol.md` : "cog-protocol.md"}
              </span>
            </div>
            <div className="w-[52px]" /> {/* Spacer for centering */}
          </div>

          {/* Code Content */}
          <div className="flex-1 p-4 overflow-auto">
            <pre className="text-sm font-mono text-zinc-300 leading-relaxed">
              {compiledProtocol.split("\n").map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.01, duration: 0.2 }}
                  className="hover:bg-zinc-800/30 px-2 -mx-2 rounded group flex"
                >
                  <span className="w-8 text-zinc-700 select-none text-right pr-3 group-hover:text-zinc-600">
                    {i + 1}
                  </span>
                  {line.startsWith("#") ? (
                    <span className="text-primary">{line}</span>
                  ) : line.startsWith("**") ? (
                    <span className="text-zinc-100">{line}</span>
                  ) : line.startsWith("-") || line.startsWith(">") ? (
                    <span className="text-zinc-400">{line}</span>
                  ) : line.startsWith("---") ? (
                    <span className="text-zinc-600">{line}</span>
                  ) : line.includes("`") ? (
                    <span className="text-violet-400">{line}</span>
                  ) : (
                    <span>{line || " "}</span>
                  )}
                </motion.div>
              ))}
            </pre>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isComplete ? "bg-green-500" : "bg-amber-500"}`} />
              {isComplete ? "Ready" : "Incomplete"}
            </span>
          </div>
          <span>Markdown • UTF-8</span>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
