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
      initialSubscription={initialSubscription}
      initialEmail={email}
      initialIsAnonymous={isAnonymous}
    >
      <WorkspaceProvider
        initialProjects={initialProjects}
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
