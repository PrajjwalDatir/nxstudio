import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  Collection,
  CollectionRow,
  Project,
  ProjectRow,
  rowToCollection,
  rowToProject,
} from "./projects";

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

/**
 * Load the user's collections (product groups). Returns [] if the collections
 * table isn't there yet (migration 0004 not run) so the app still boots.
 */
export async function fetchCollections(): Promise<Collection[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .order("sort", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as CollectionRow[]).map(rowToCollection);
}
