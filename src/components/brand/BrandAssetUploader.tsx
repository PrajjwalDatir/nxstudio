"use client";

import React, { useRef, useState } from "react";
import { UploadIcon, TrashIcon, CheckIcon, ImageIcon, SunIcon, MoonIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface BrandAssetUploaderProps {
  label: string;
  description: string;
  assetUrl?: string;
  assetName?: string;
  aspectHint?: string;
  recommendedSize?: string;
  onUpload: (dataUrl: string, fileName: string) => void;
  onRemove: () => void;
  className?: string;
}

export function BrandAssetUploader({
  label,
  description,
  assetUrl,
  assetName,
  aspectHint = "Square (1:1) recommended",
  recommendedSize = "SVG or PNG up to 2MB",
  onUpload,
  onRemove,
  className,
}: BrandAssetUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewBg, setPreviewBg] = useState<"dark" | "light" | "checker">("dark");
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (SVG, PNG, JPG, or WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File exceeds 5MB limit");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onUpload(result, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={cn("rounded-2xl border border-border/80 bg-card/60 p-4 transition-all shadow-xs", className)}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-xs font-semibold text-foreground tracking-tight">{label}</h4>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
        {assetUrl && (
          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-secondary/40 p-0.5">
            <button
              type="button"
              onClick={() => setPreviewBg("dark")}
              title="Preview on dark surface"
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] transition-colors",
                previewBg === "dark" ? "bg-primary text-primary-foreground shadow-2xs font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MoonIcon className="h-2.5 w-2.5" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewBg("light")}
              title="Preview on light surface"
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] transition-colors",
                previewBg === "light" ? "bg-primary text-primary-foreground shadow-2xs font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <SunIcon className="h-2.5 w-2.5" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewBg("checker")}
              title="Preview with transparency grid"
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] transition-colors font-mono",
                previewBg === "checker" ? "bg-primary text-primary-foreground shadow-2xs font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              ▦
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/svg+xml,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {assetUrl ? (
        <div className="space-y-2 mt-3">
          {/* Asset Preview Viewport */}
          <div
            className={cn(
              "relative flex h-28 w-full items-center justify-center rounded-xl border border-border/70 p-3 transition-all overflow-hidden",
              previewBg === "dark" && "bg-neutral-950",
              previewBg === "light" && "bg-white",
              previewBg === "checker" && "bg-[linear-gradient(45deg,#1f1f23_25%,transparent_25%),linear-gradient(-45deg,#1f1f23_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1f1f23_75%),linear-gradient(-45deg,transparent_75%,#1f1f23_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] bg-neutral-900"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assetUrl}
              alt={assetName || label}
              className="max-h-full max-w-full object-contain drop-shadow-sm select-none"
            />
          </div>

          {/* Meta & Actions */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[180px]" title={assetName}>
              {assetName || "Uploaded asset"}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-secondary transition-colors"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={onRemove}
                title="Remove asset"
                className="rounded-lg border border-red-500/20 bg-red-500/10 p-1 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <TrashIcon className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Upload Dropzone */
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "group relative mt-3 flex flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition-all cursor-pointer",
            isDragging
              ? "border-lilac bg-lilac/10 scale-[0.99]"
              : "border-border/80 bg-secondary/20 hover:border-lilac/50 hover:bg-secondary/40"
          )}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/60 text-muted-foreground group-hover:text-lilac group-hover:scale-110 transition-all">
            <UploadIcon className="h-4 w-4" />
          </div>

          <span className="mt-2 text-xs font-medium text-foreground">
            Drop file or <span className="text-lilac underline">browse</span>
          </span>

          <span className="mt-0.5 text-[10px] text-muted-foreground font-mono">
            {aspectHint} · {recommendedSize}
          </span>
        </div>
      )}

      {error && (
        <p className="mt-2 text-[11px] text-red-400 font-mono">{error}</p>
      )}
    </div>
  );
}
