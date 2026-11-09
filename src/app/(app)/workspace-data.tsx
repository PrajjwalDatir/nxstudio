import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import { fetchProjects, fetchCollections } from "@/lib/projects-server";
import { fetchSubscriptionServer } from "@/lib/subscription-server";
import { WorkspaceProvider } from "@/lib/workspace-store";
import { CommandProvider } from "@/components/shell/CommandPalette";
import { SidebarProvider } from "@/components/shell/sidebar-context";
import { AppShell } from "@/components/shell/AppShell";
import { SubscriptionProvider } from "@/lib/use-subscription";
import { getUser as getGhUser } from "@/lib/github-server";
import type { GitHubStatus } from "@/lib/github-types";
import { isLocalMode } from "@/lib/supabase/config";
import { loadLocalWorkspace } from "@/lib/local-workspace";

/**
 * GitHub connection status rarely changes and costs a full round trip to the
 * GitHub REST API, so it's cached for a short window. Keyed by the token
 * itself (not the user id) so the cache never needs `cookies()` internally,
 * which `unstable_cache` disallows.
 */
const getCachedGhUser = unstable_cache(
  async (token: string) => getGhUser(token),
  ["github-user"],
  { revalidate: 60 }
);

/**
 * Isolated in its own async Server Component so `(app)/layout.tsx` can wrap
 * it in a `<Suspense>` boundary: the shell (nav chrome, loader) streams to
 * the browser immediately instead of blocking on this data fetch.
 */
export async function WorkspaceData({
  children,
  userId,
  email,
  isAnonymous,
}: {
  children: React.ReactNode;
  userId: string;
  email: string;
  isAnonymous: boolean;
}) {
  const token = (await cookies()).get("gh_token")?.value;

  const [initialProjects, initialCollections, initialSubscription, ghUser] = await Promise.all([
    fetchProjects(),
    fetchCollections(),
    fetchSubscriptionServer(userId),
    token ? getCachedGhUser(token) : Promise.resolve(null),
  ]);

  let projects = initialProjects;
  let subscription = initialSubscription;

  if (isLocalMode) {
    subscription = {
      provider: "local",
      status: "active",
      plan_id: "pro_10",
      current_end: null,
      current_period_end: null,
    };
    if (projects.length === 0) {
      const localWs = loadLocalWorkspace();
      projects = [
        {
          id: "proj_local",
          createdAt: new Date().toISOString(),
          data: localWs,
          github: { repo: null, branch: "main" },
          dueDates: {},
          collectionId: null,
        },
      ];
    }
  }

  let initialGitHubStatus: GitHubStatus = { connected: false };
  if (ghUser) {
    initialGitHubStatus = {
      connected: true,
      login: ghUser.login,
      avatar: ghUser.avatar_url,
      name: ghUser.name,
    };
  }

  return (
    <SubscriptionProvider
      initialSubscription={subscription}
      initialEmail={email}
      initialIsAnonymous={isAnonymous}
    >
      <WorkspaceProvider
        initialProjects={projects}
        initialCollections={initialCollections}
        userId={userId}
        initialGitHubStatus={initialGitHubStatus}
      >
        <CommandProvider>
          <SidebarProvider>
            <AppShell userEmail={email} isAnonymous={isAnonymous}>
              {children}
            </AppShell>
          </SidebarProvider>
        </CommandProvider>
      </WorkspaceProvider>
    </SubscriptionProvider>
  );
}
