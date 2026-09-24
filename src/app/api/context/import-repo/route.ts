import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { withAuthApiHandler } from "@/lib/api-handler";
import { generateStructured, DEFAULT_MODEL } from "@/lib/ai/gemini";
import { consumeAiBudget } from "@/lib/ai/budget";
import { fetchRepoContextForImport } from "@/lib/github-server";
import { normalizeGitHubRepo } from "@/lib/github";
import {
  WorkspaceData,
  ProductSchema,
  SchemaTable,
  SchemaField,
  SchemaRelation,
  Surface,
  Capability,
} from "@/lib/types";

export const runtime = "nodejs";

interface ImportRepoRequest {
  codebaseContext?: string;
  repoName?: string;
  githubRepo?: string;
  githubBranch?: string;
}

const IMPORT_SCHEMA = {
  type: "object",
  properties: {
    productName: { type: "string" },
    idea: {
      type: "object",
      properties: {
        problem: { type: "string" },
        targetUsers: { type: "string" },
        currentSolutions: { type: "string" },
        differentiation: { type: "string" },
      },
      required: ["problem", "targetUsers", "currentSolutions", "differentiation"],
    },
    brand: {
      type: "object",
      properties: {
        vibe: { type: "string" },
        primaryColor: { type: "string" },
        font: { type: "string" },
        radius: { type: "string" },
        motionPreset: { type: "string" },
        motionSpeed: { type: "string" },
      },
      required: ["vibe", "primaryColor", "font", "radius"],
    },
    tech: {
      type: "object",
      properties: {
        surfaces: {
          type: "array",
          items: { type: "string", enum: ["web", "ios", "android", "desktop"] },
        },
        capabilities: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "auth",
              "database",
              "realtime",
              "multiplayer",
              "payments",
              "storage",
              "push",
              "ai",
              "graphics",
            ],
          },
        },
      },
      required: ["surfaces", "capabilities"],
    },
    schema: {
      type: "object",
      properties: {
        tables: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              fields: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    type: {
                      type: "string",
                      enum: ["uuid", "string", "int", "float", "boolean", "datetime", "json", "text"],
                    },
                    isPrimary: { type: "boolean" },
                    isNullable: { type: "boolean" },
                    isUnique: { type: "boolean" },
                  },
                  required: ["name", "type"],
                },
              },
            },
            required: ["name", "fields"],
          },
        },
        relations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              sourceTableName: { type: "string" },
              sourceFieldName: { type: "string" },
              targetTableName: { type: "string" },
              targetFieldName: { type: "string" },
              type: { type: "string", enum: ["1:1", "1:N", "N:N"] },
            },
            required: ["sourceTableName", "sourceFieldName", "targetTableName", "targetFieldName", "type"],
          },
        },
      },
      required: ["tables"],
    },
  },
  required: ["productName", "idea", "brand", "tech", "schema"],
};

export const POST = withAuthApiHandler<ImportRepoRequest>(async (req, user, body) => {
  let context = body.codebaseContext?.trim() || "";
  let detectedName: string | undefined = body.repoName?.trim();
  let resolvedRepo: string | null = null;
  let resolvedBranch = body.githubBranch?.trim() || "main";

  if (body.githubRepo?.trim()) {
    const rawRepo = body.githubRepo.trim();
    resolvedRepo = normalizeGitHubRepo(rawRepo);

    // If context is omitted or short, auto-fetch from GitHub directly
    if (context.length < 20) {
      const token = (await cookies()).get("gh_token")?.value;
      const ghContext = await fetchRepoContextForImport(token, resolvedRepo, resolvedBranch);
      if ("error" in ghContext) {
        return NextResponse.json({ error: ghContext.error }, { status: ghContext.status });
      }
      context = ghContext.combinedContext;
      resolvedBranch = ghContext.branch;
      if (!detectedName && ghContext.productName) {
        detectedName = ghContext.productName;
      }
    }
  }

  if (!context || context.length < 20) {
    return NextResponse.json(
      { error: "Please provide a valid GitHub repository or paste codebase context (e.g. file tree, package.json, schema, README)." },
      { status: 400 }
    );
  }

  // Guard budget
  const budget = await consumeAiBudget();
  if (budget === "daily_cap") {
    return NextResponse.json(
      { error: "Daily AI analysis quota exceeded. Please try again tomorrow." },
      { status: 429 }
    );
  }
  if (budget === "rate_limited") {
    return NextResponse.json(
      { error: "AI service is busy with requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  const prompt = `You are a Principal Software Architect & Product Systems Engineer.
You have been provided with raw parsed codebase context (such as repository structure, package.json, SQL/Prisma schemas, API routes, or README) from an existing software product.

Your task is to reverse-engineer and map this codebase into a comprehensive, deterministic Product Operating System specification (nxstudio canvas format):

1. **Product Name & Idea**:
   - Derive the canonical product name.
   - Reverse-engineer the core problem being solved, the target user persona, how people solved it before, and what makes this codebase/product uniquely differentiated.
2. **Brand & Design DNA**:
   - Identify or infer the design aesthetic/vibe (e.g. "Clean Minimalist", "Cyber-Physical Dark", "Enterprise SaaS").
   - Primary brand accent color (hex code like #7C3AED, #10B981, #3B82F6).
   - Font family and corner radius (e.g. 8px, 12px, 16px).
   - Motion preset ("snappy", "gentle", "float", "elastic").
3. **Tech Stack & Surfaces**:
   - Surfaces: Identify which surfaces exist ("web", "ios", "android", "desktop").
   - Capabilities: Identify features present ("auth", "database", "realtime", "payments", "storage", "ai", etc.).
4. **Data Modeling & Schema ERD**:
   - Extract the core database tables (entities).
   - For each table, extract fields with appropriate types ("uuid", "string", "int", "float", "boolean", "datetime", "json", "text"), noting primary key and nullability.
   - Detect foreign key relationships between tables with cardinalities ("1:1", "1:N", "N:N").

Here is the parsed codebase context:
---
${context.slice(0, 15000)}
---

Respond with strictly structured JSON conformant to the requested schema.`;

  try {
    const rawResult = await generateStructured<{
      productName: string;
      idea: {
        problem: string;
        targetUsers: string;
        currentSolutions: string;
        differentiation: string;
      };
      brand: {
        vibe: string;
        primaryColor: string;
        font: string;
        radius: string;
        motionPreset?: string;
        motionSpeed?: string;
      };
      tech: {
        surfaces: Surface[];
        capabilities: Capability[];
      };
      schema: {
        tables: {
          name: string;
          description?: string;
          fields: {
            name: string;
            type: "uuid" | "string" | "int" | "float" | "boolean" | "datetime" | "json" | "text";
            isPrimary?: boolean;
            isNullable?: boolean;
            isUnique?: boolean;
          }[];
        }[];
        relations?: {
          sourceTableName: string;
          sourceFieldName: string;
          targetTableName: string;
          targetFieldName: string;
          type: "1:1" | "1:N" | "N:N";
        }[];
      };
    }>({
      prompt,
      schema: IMPORT_SCHEMA,
      model: DEFAULT_MODEL,
      temperature: 0.3,
    });

    // Post-process table IDs and relation references to form a valid ProductSchema
    const tableIdMap = new Map<string, string>();
    const fieldIdMap = new Map<string, Map<string, string>>();

    const processedTables: SchemaTable[] = rawResult.schema.tables.map((tbl, idx) => {
      const tableId = `t_${Math.random().toString(36).slice(2, 8)}_${idx}`;
      tableIdMap.set(tbl.name.toLowerCase(), tableId);

      const fMap = new Map<string, string>();
      fieldIdMap.set(tableId, fMap);

      const fields: SchemaField[] = tbl.fields.map((fld, fIdx) => {
        const fieldId = `f_${tableId}_${fIdx}`;
        fMap.set(fld.name.toLowerCase(), fieldId);
        return {
          id: fieldId,
          name: fld.name,
          type: fld.type,
          isPrimary: Boolean(fld.isPrimary),
          isNullable: Boolean(fld.isNullable),
          isUnique: Boolean(fld.isUnique),
        };
      });

      return {
        id: tableId,
        name: tbl.name,
        description: tbl.description,
        position: { x: 40 + (idx % 3) * 320, y: 40 + Math.floor(idx / 3) * 260 },
        fields,
      };
    });

    const processedRelations: SchemaRelation[] = [];
    if (rawResult.schema.relations) {
      rawResult.schema.relations.forEach((rel, rIdx) => {
        const sourceTableId = tableIdMap.get(rel.sourceTableName.toLowerCase());
        const targetTableId = tableIdMap.get(rel.targetTableName.toLowerCase());

        if (sourceTableId && targetTableId) {
          const sFields = fieldIdMap.get(sourceTableId);
          const tFields = fieldIdMap.get(targetTableId);
          const sourceFieldId = sFields?.get(rel.sourceFieldName.toLowerCase());
          const targetFieldId = tFields?.get(rel.targetFieldName.toLowerCase());

          if (sourceFieldId && targetFieldId) {
            processedRelations.push({
              id: `r_${rIdx}_${Math.random().toString(36).slice(2, 6)}`,
              sourceTableId,
              sourceFieldId,
              targetTableId,
              targetFieldId,
              type: rel.type,
            });
          }
        }
      });
    }

    const structuredSchema: ProductSchema = {
      tables: processedTables,
      relations: processedRelations,
    };

    const patch: Partial<WorkspaceData> = {
      productName: rawResult.productName || detectedName || body.repoName || "Imported Product",
      idea: rawResult.idea,
      brand: {
        vibe: rawResult.brand.vibe || "Modern Industrial",
        primaryColor: rawResult.brand.primaryColor || "#7C3AED",
        font: rawResult.brand.font || "Geist Sans",
        radius: rawResult.brand.radius || "12px",
        motionPreset: rawResult.brand.motionPreset || "snappy",
        motionSpeed: rawResult.brand.motionSpeed || "1",
      },
      tech: {
        surfaces: rawResult.tech.surfaces || ["web"],
        capabilities: rawResult.tech.capabilities || ["auth", "database"],
      },
      schema: structuredSchema,
    };

    return NextResponse.json({
      ok: true,
      patch,
      github: resolvedRepo ? { repo: resolvedRepo, branch: resolvedBranch } : null,
    });
  } catch (err) {
    console.error("Failed to import and analyze codebase context:", err);
    return NextResponse.json(
      { error: "Failed to reverse-engineer codebase context. Please ensure the snippet contains valid code or file listings." },
      { status: 500 }
    );
  }
});
