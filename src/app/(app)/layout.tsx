import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShellLoader } from "@/components/shell/ShellLoader";
import { WorkspaceData } from "./workspace-data";

// Belt-and-suspenders alongside robots.ts: a meta robots tag holds even if a
// crawler ignores /robots.txt disallow rules or a deep link got indexed
// before a route was added there.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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

  // The auth check above is the only thing that has to block. Projects,
  // collections, subscription, and GitHub status stream in behind Suspense so
  // the browser gets bytes (and the same neutral loader AppShell already
  // shows pre-hydration) immediately instead of waiting on every query.
  return (
    <Suspense fallback={<ShellLoader />}>
      <WorkspaceData userId={user.id} email={user.email ?? ""} isAnonymous={user.is_anonymous ?? false}>
        {children}
      </WorkspaceData>
    </Suspense>
  );
}
