import "server-only";
import { createClient } from "@/lib/supabase/server";
import { Project, ProjectRow, rowToProject } from "./projects";

/**
 * Load the signed-in user's projects on the server so the app shell renders
 * with real data on the first paint — no client-side fetch waterfall, no
 * loading flash. RLS scopes the query to the caller; ordering is stable so the
 * client's "first project = active fallback" is deterministic.
 */
export async function fetchProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as ProjectRow[]).map(rowToProject);
}
