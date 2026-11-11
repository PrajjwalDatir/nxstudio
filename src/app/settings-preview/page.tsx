import { McpTokensSection } from "@/components/settings/McpTokensSection";
import { ReworkBanner } from "@/components/shell/ReworkBanner";

/**
 * Public preview of the MCP Tokens section — no auth required.
 * Used for screenshots, documentation, and feature demos.
 * Accessible at /settings-preview (added to PUBLIC_PREFIXES in middleware).
 */
export default function SettingsPreviewPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ReworkBanner />
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
        {/* Preview banner */}
        <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-xs font-mono text-primary">
          ↗ Preview Mode — Settings / MCP Access Tokens
        </div>

        <McpTokensSection />
      </div>
    </div>
  );
}
