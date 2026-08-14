import "server-only";

// gemini-2.5-flash-lite is no longer available to new API keys (Google
// deprecates dated model ids on a rolling basis) — pinned to a concrete
// stable id rather than a "-latest" alias so behavior/cost don't shift under
// us silently; bump via GEMINI_MODEL when this one is retired in turn.
export const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

interface GenerateStructuredOptions {
  prompt: string;
  /** JSON Schema the response is constrained to (Gemini's responseSchema). */
  schema: Record<string, unknown>;
  model?: string;
  temperature?: number;
}

/**
 * Server-only Gemini call, forced to return schema-conformant JSON via
 * responseSchema — callers get a typed object back, never prose to parse.
 * Plain fetch against the REST endpoint (no SDK dependency) so swapping
 * model/provider later is a one-file change.
 */
export async function generateStructured<T>(opts: GenerateStructuredOptions): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY.");

  const model = opts.model ?? DEFAULT_MODEL;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: opts.prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: opts.schema,
          temperature: opts.temperature ?? 0.4,
        },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini API error ${res.status}: ${text.slice(0, 300)}`);
  }

  const body = await res.json();
  const text: string | undefined = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content.");

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Gemini returned malformed JSON.");
  }
}
