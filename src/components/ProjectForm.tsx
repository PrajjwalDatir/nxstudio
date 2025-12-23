"use client";

import { useProtocol } from "@/lib/protocol-store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { CopyIcon, CheckIcon, DownloadIcon, ZapIcon } from "@/components/icons";
import { useState, useCallback, useEffect } from "react";

const formFields = [
  { id: "name", label: "Project Name", placeholder: "Hyperion", col: 1 },
  { id: "audience", label: "Audience", placeholder: "Startup Founders", col: 1 },
  { id: "stack", label: "Stack", placeholder: "Next.js, Supabase, Tailwind", col: 2 },
  { id: "constraints", label: "Constraints", placeholder: "Client-side only, No backend", col: 2 },
] as const;

export function ProjectForm() {
  const { data, updateField, compiledProtocol } = useProtocol();
  const [copied, setCopied] = useState(false);

  // Calculate completion
  const filled = [data.name, data.mission, data.stack, data.constraints, data.audience]
    .filter((v) => v.trim().length > 0).length;
  const percent = Math.round((filled / 5) * 100);
  const isComplete = percent === 100;

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(compiledProtocol);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [compiledProtocol]);

  // Download
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "c") {
        e.preventDefault();
        handleCopy();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "s") {
        e.preventDefault();
        handleDownload();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleCopy, handleDownload]);

  return (
    <TooltipProvider delayDuration={300}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-5"
      >
        {/* Two-column grid for short fields */}
        <div className="grid sm:grid-cols-2 gap-4">
          {formFields.map((field) => (
            <div key={field.id} className="space-y-1.5">
              <Label htmlFor={field.id} className="text-xs font-medium text-zinc-400">
                {field.label}
              </Label>
              <Input
                id={field.id}
                placeholder={field.placeholder}
                value={data[field.id as keyof typeof data] || ""}
                onChange={(e) => updateField(field.id as keyof typeof data, e.target.value)}
                className="h-9 bg-zinc-900/50 border-zinc-800 focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-zinc-600"
              />
            </div>
          ))}
        </div>

        {/* Mission - full width */}
        <div className="space-y-1.5">
          <Label htmlFor="mission" className="text-xs font-medium text-zinc-400">
            Mission
          </Label>
          <Textarea
            id="mission"
            placeholder="What problem does this solve? Who benefits?"
            value={data.mission || ""}
            onChange={(e) => updateField("mission", e.target.value)}
            className="h-20 bg-zinc-900/50 border-zinc-800 focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-zinc-600 resize-none"
          />
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!data.name}
                  className="h-8 text-zinc-400 hover:text-white"
                >
                  <DownloadIcon className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">.md</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download as Markdown (⇧⌘S)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 gap-1.5 bg-primary hover:bg-primary/90"
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="flex items-center gap-1.5"
                      >
                        <CheckIcon className="h-4 w-4" />
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
                        <CopyIcon className="h-4 w-4" />
                        <span>Copy Protocol</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy to clipboard (⇧⌘C)</TooltipContent>
            </Tooltip>
          </div>

          <Badge 
            variant={isComplete ? "default" : "secondary"}
            className={`h-6 ${isComplete ? "bg-primary/20 text-primary border-primary/30" : ""}`}
          >
            {isComplete && <ZapIcon className="h-3 w-3 mr-1" />}
            {percent}%
          </Badge>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
