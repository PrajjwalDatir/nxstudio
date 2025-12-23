"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsIcon } from "@/components/icons";
import { useState, useEffect } from "react";

interface Profile {
  name: string;
  defaultStack: string;
}

const PROFILE_KEY = "nx-studio-profile";

export function ProfileMenu() {
  const [profile, setProfile] = useState<Profile>({ name: "", defaultStack: "" });
  const [open, setOpen] = useState(false);

  // Load profile
  useEffect(() => {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse profile:", e);
      }
    }
  }, []);

  // Save profile
  const saveProfile = (updates: Partial<Profile>) => {
    const updated = { ...profile, ...updates };
    setProfile(updated);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
  };

  const initials = profile.name
    ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "NX";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Avatar className="h-7 w-7 border border-zinc-700">
            <AvatarFallback className="bg-zinc-800 text-xs text-zinc-400">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
            <SettingsIcon className="h-4 w-4 text-zinc-500" />
            <span className="text-sm font-medium">Profile Settings</span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name" className="text-xs text-zinc-400">
                Your Name
              </Label>
              <Input
                id="profile-name"
                placeholder="e.g., Alex Chen"
                value={profile.name}
                onChange={(e) => saveProfile({ name: e.target.value })}
                className="h-8 text-sm bg-zinc-900/50 border-zinc-800"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="default-stack" className="text-xs text-zinc-400">
                Default Stack
              </Label>
              <Input
                id="default-stack"
                placeholder="Next.js, Supabase, Tailwind"
                value={profile.defaultStack}
                onChange={(e) => saveProfile({ defaultStack: e.target.value })}
                className="h-8 text-sm bg-zinc-900/50 border-zinc-800"
              />
              <p className="text-xs text-zinc-600">Auto-fills new protocols</p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Export helper to get default stack
export function useDefaultStack(): string {
  const [defaultStack, setDefaultStack] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (stored) {
      try {
        const profile = JSON.parse(stored);
        setDefaultStack(profile.defaultStack || "");
      } catch (e) {
        // ignore
      }
    }
  }, []);

  return defaultStack;
}
