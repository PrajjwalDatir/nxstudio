import { LogoLoader } from "@/components/ui/LogoLoader";

/**
 * App-level loading boundary — shown when navigating between major sections
 * (Canvas → Studio → Tasks, etc.) while the next page's server component
 * resolves. The shell (sidebar + topbar) stays painted.
 */
export default function AppLoading() {
  return <LogoLoader />;
}
