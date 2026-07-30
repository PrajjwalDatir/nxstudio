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

export async function fetchProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as ProjectRow[]).map(rowToProject);
}

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
