/**
 * Prompt SHAPES only. The actual prompt prose used to live here, but it is the
 * product — so it now lives in the `prompt_templates` Supabase table and is
 * compiled server-side, for premium users only, by `prompts-server.ts` (exposed
 * via POST /api/prompts/compile). Nothing here reveals a prompt.
 *
 * Client components fetch compiled prompts through `use-compiled-prompts.ts`.
 */

export interface CompiledPrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
}

/** Back-compat alias for existing importers. */
export type DepthPrompt = CompiledPrompt;

export interface CompiledPrompts {
  idea: CompiledPrompt;
  master: CompiledPrompt;
  depth: CompiledPrompt[];
}
