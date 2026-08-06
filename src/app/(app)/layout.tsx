import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { fetchProjects, fetchCollections } from "@/lib/projects-server";
import { fetchSubscriptionServer } from "@/lib/subscription-server";
import { WorkspaceProvider } from "@/lib/workspace-store";
import { CommandProvider } from "@/components/shell/CommandPalette";
import { SidebarProvider } from "@/components/shell/sidebar-context";
import { AppShell } from "@/components/shell/AppShell";
import { SubscriptionProvider } from "@/lib/use-subscription";
import { getUser as getGhUser } from "@/lib/github-server";
import type { GitHubStatus } from "@/lib/github-types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth: the middleware already gates this route, but we re-verify
  // server-side so a Server Component never renders for an unauthenticated user.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const token = (await cookies()).get("gh_token")?.value;

  // Load the user's projects + collections on the server so the shell renders
  // with real data on first paint.
  const [initialProjects, initialCollections, initialSubscription, ghUser] = await Promise.all([
    fetchProjects(),
    fetchCollections(),
    fetchSubscriptionServer(user.id),
    token ? getGhUser(token) : Promise.resolve(null),
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
      initialEmail={user.email ?? ""}
      initialIsAnonymous={user.is_anonymous ?? false}
    >
      <WorkspaceProvider
        initialProjects={initialProjects}
        initialCollections={initialCollections}
        userId={user.id}
        initialGitHubStatus={initialGitHubStatus}
      >
        <CommandProvider>
          <SidebarProvider>
            <AppShell userEmail={user.email ?? ""} isAnonymous={user.is_anonymous ?? false}>{children}</AppShell>
          </SidebarProvider>
        </CommandProvider>
      </WorkspaceProvider>
    </SubscriptionProvider>
  );
}
