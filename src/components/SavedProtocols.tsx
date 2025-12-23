"use client";

import { useProtocol, ProjectData } from "@/lib/protocol-store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SaveIcon, FolderIcon, TrashIcon, ChevronDownIcon, PlusIcon } from "@/components/icons";
import { useState, useEffect, useCallback } from "react";

interface SavedProtocol {
  id: string;
  name: string;
  data: ProjectData;
  createdAt: string;
}

const SAVED_KEY = "nx-studio-saved-protocols";

export function SavedProtocols() {
  const { data, updateField, clearData } = useProtocol();
  const [saved, setSaved] = useState<SavedProtocol[]>([]);

  // Load saved protocols
  useEffect(() => {
    const stored = localStorage.getItem(SAVED_KEY);
    if (stored) {
      try {
        setSaved(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved protocols:", e);
      }
    }
  }, []);

  // Save current protocol
  const handleSave = useCallback(() => {
    if (!data.name.trim()) return;

    const newProtocol: SavedProtocol = {
      id: Date.now().toString(),
      name: data.name,
      data: { ...data },
      createdAt: new Date().toISOString(),
    };

    const updated = [...saved, newProtocol];
    setSaved(updated);
    localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
  }, [data, saved]);

  // Load a protocol
  const handleLoad = useCallback((protocol: SavedProtocol) => {
    Object.entries(protocol.data).forEach(([key, value]) => {
      updateField(key as keyof ProjectData, value);
    });
  }, [updateField]);

  // Delete a protocol
  const handleDelete = useCallback((id: string) => {
    const updated = saved.filter((p) => p.id !== id);
    setSaved(updated);
    localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
  }, [saved]);

  const canSave = data.name.trim().length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-zinc-400 hover:text-white">
          <FolderIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Saved</span>
          <ChevronDownIcon className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-zinc-500">Protocols</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {saved.length === 0 ? (
          <div className="px-2 py-3 text-sm text-zinc-500 text-center">
            No saved protocols
          </div>
        ) : (
          saved.map((protocol) => (
            <DropdownMenuItem
              key={protocol.id}
              className="flex items-center justify-between group"
            >
              <button
                onClick={() => handleLoad(protocol)}
                className="flex-1 text-left truncate"
              >
                {protocol.name}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(protocol.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity"
              >
                <TrashIcon className="h-3 w-3" />
              </button>
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSave} disabled={!canSave}>
          <SaveIcon className="h-4 w-4 mr-2" />
          Save Current
        </DropdownMenuItem>
        <DropdownMenuItem onClick={clearData}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Protocol
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
