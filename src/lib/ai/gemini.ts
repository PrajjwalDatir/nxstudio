import "server-only";

// Model fallback chain: Google regularly shifts demand and retires dated IDs.
// We start with the stable gemini-2.5-flash and cascade through live alternatives
// if a 503 (high demand), 429 (rate limit), or 404 occurs.
export const FALLBACK_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.5-flash-lite",
].filter(Boolean) as string[];

export const DEFAULT_MODEL = FALLBACK_MODELS[0] || "gemini-2.5-flash";

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
 * Resilient multi-model fallback ensures temporary Google 503 demand spikes
 * or 429 quota bursts on one model seamlessly recover on another.
 */
export async function generateStructured<T>(opts: GenerateStructuredOptions): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY.");

  const candidateModels = opts.model
    ? [opts.model, ...FALLBACK_MODELS.filter((m) => m !== opts.model)]
    : FALLBACK_MODELS;

  let lastError: Error | null = null;

  for (const model of candidateModels) {
    try {
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
        // If transient capacity spike (503), rate limit (429), or deprecated (404), try next model
        if (res.status === 503 || res.status === 429 || res.status === 404) {
          console.warn(`Gemini model ${model} returned HTTP ${res.status} (${text.slice(0, 120)}), falling back...`);
          lastError = new Error(`Gemini API error ${res.status} on ${model}: ${text.slice(0, 200)}`);
          continue;
        }
        throw new Error(`Gemini API error ${res.status}: ${text.slice(0, 300)}`);
      }

      const body = await res.json();
      const text: string | undefined = body?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.warn(`Gemini model ${model} returned empty content, trying fallback...`);
        lastError = new Error(`Gemini model ${model} returned no content.`);
        continue;
      }

      try {
        return JSON.parse(text) as T;
      } catch {
        console.warn(`Gemini model ${model} returned unparseable JSON, trying fallback...`);
        lastError = new Error(`Gemini model ${model} returned malformed JSON.`);
        continue;
      }
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Gemini call failed with model ${model}: ${lastError.message}`);
    }
  }

  throw lastError || new Error("All candidate Gemini models failed.");
}
