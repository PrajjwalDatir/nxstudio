"use client";

import dynamic from "next/dynamic";
import { ProtocolProvider } from "@/lib/protocol-store";
import { ProjectForm } from "@/components/ProjectForm";
import { SavedProtocols } from "@/components/SavedProtocols";
import { ProfileMenu } from "@/components/ProfileMenu";
import { motion } from "framer-motion";
import { NxLogo } from "@/components/icons";

// Dynamic import for R3F to avoid SSR issues
const Background3D = dynamic(
  () => import("@/components/Background3D").then((mod) => mod.Background3D),
  { ssr: false }
);

export default function Home() {
  return (
    <ProtocolProvider>
      {/* 3D Background */}
      <Background3D />

      {/* Main Content */}
      <main className="min-h-screen flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-50 border-b border-zinc-800/50 backdrop-blur-md bg-zinc-950/80"
        >
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
                <NxLogo className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-white leading-tight">Nx Studio</h1>
                <p className="text-[10px] text-zinc-500 leading-tight">Context Compiler</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <SavedProtocols />
              <ProfileMenu />
            </div>
          </div>
        </motion.header>

        {/* Centered Card */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-full max-w-xl bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/60 rounded-xl p-6 shadow-2xl shadow-black/20"
          >
            <ProjectForm />
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="border-t border-zinc-800/30 py-3">
          <div className="max-w-3xl mx-auto px-4 flex items-center justify-between text-[10px] text-zinc-600">
            <span>Built for Founders & Architects</span>
            <span className="font-mono">Zero-Backend • LocalStorage</span>
          </div>
        </footer>
      </main>
    </ProtocolProvider>
  );
}
