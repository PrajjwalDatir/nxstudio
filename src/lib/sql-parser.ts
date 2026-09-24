import type {
  ProductSchema,
  SchemaTable,
  SchemaField,
  SchemaRelation,
  SchemaColumnType,
  RelationType,
} from "./types";

/**
 * Strips comments from SQL while preserving line structure
 */
function stripComments(sql: string): string {
  // Replace multi-line comments /* ... */ with spaces
  let result = sql.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    return match.replace(/[^\r\n]/g, " ");
  });
  // Replace single-line comments -- ... with spaces
  result = result.replace(/--[^\r\n]*/g, (match) => {
    return " ".repeat(match.length);
  });
  return result;
}

/**
 * Splits comma-separated column & constraint definitions,
 * respecting parentheses and string quotes.
 */
function splitDefinitions(body: string): string[] {
  const defs: string[] = [];
  let current = "";
  let parenDepth = 0;
  let inQuote = false;
  let quoteChar = "";

  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inQuote) {
      current += ch;
      if (ch === quoteChar) {
        inQuote = false;
      }
    } else if (ch === '"' || ch === "'" || ch === "`") {
      inQuote = true;
      quoteChar = ch;
      current += ch;
    } else if (ch === "(") {
      parenDepth++;
      current += ch;
    } else if (ch === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      current += ch;
    } else if (ch === "," && parenDepth === 0) {
      if (current.trim()) defs.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }

  if (current.trim()) {
    defs.push(current.trim());
  }

  return defs;
}

/**
 * Clean identifier: removes surrounding quotes ("users", 'users', `users` -> users)
 * and strips schema prefixes (public.users -> users)
 */
export function cleanIdentifier(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.includes(".")) {
    const parts = cleaned.split(".");
    cleaned = parts[parts.length - 1];
  }
  return cleaned.replace(/^["'`]|["'`]$/g, "").trim();
}

/**
 * Maps raw SQL data types to SchemaColumnType
 */
export function mapSqlTypeToSchemaType(rawType: string): SchemaColumnType {
  const t = rawType.toLowerCase().trim();
  if (t.includes("uuid")) return "uuid";
  if (t.includes("bool")) return "boolean";
  if (t.includes("json")) return "json";
  if (
    t.includes("float") ||
    t.includes("double") ||
    t.includes("real") ||
    t.includes("numeric") ||
    t.includes("decimal")
  ) {
    return "float";
  }
  if (
    t.includes("int") ||
    t.includes("serial") ||
    t.includes("smallint") ||
    t.includes("bigint")
  ) {
    return "int";
  }
  if (
    t.includes("time") ||
    t.includes("date") ||
    t.includes("timestamp") ||
    t.includes("timestamptz")
  ) {
    return "datetime";
  }
  if (t.includes("text") || t.includes("clob") || t.includes("longtext")) {
    return "text";
  }
  // Default fallback (varchar, char, string, etc.)
  return "string";
}

interface RawFkRelation {
  sourceTable: string;
  sourceCol: string;
  targetTable: string;
  targetCol: string;
  line?: number;
}

export interface SqlDiagnostic {
  severity: "error" | "warning" | "info";
  message: string;
  line?: number;
  table?: string;
  column?: string;
}

export interface ParseResult {
  schema: ProductSchema;
  tableCount: number;
  relationCount: number;
  isValid: boolean;
  diagnostics: SqlDiagnostic[];
  warnings: string[];
  error?: string;
}

/**
 * Computes 1-based line number from a character index in SQL text
 */
export function getLineNumber(text: string, charIndex: number): number {
  if (charIndex <= 0) return 1;
  const safeIdx = Math.min(charIndex, text.length);
  return text.slice(0, safeIdx).split("\n").length;
}

/**
 * Parses raw SQL DDL into a structured ProductSchema (tables and relations)
 * with thorough syntax, relational integrity, and semantic validation.
 * Reuses existing table IDs and positions if names match to preserve canvas layout.
 */
export function parseSqlToSchema(
  sql: string,
  existingTables: SchemaTable[] = [],
  existingRelations: SchemaRelation[] = []
): ParseResult {
  const diagnostics: SqlDiagnostic[] = [];
  const warnings: string[] = [];
  const cleanSql = stripComments(sql);

  // Check for common syntax typos before parsing
  const typoRegex = /\b(CREAT\s+TABLE|CREATE\s+TABEL|TABLE\s+IF\s+NOT\s+EXISTS)\b/gi;
  let typoMatch: RegExpExecArray | null;
  while ((typoMatch = typoRegex.exec(cleanSql)) !== null) {
    const line = getLineNumber(sql, typoMatch.index);
    diagnostics.push({
      severity: "error",
      message: `Syntax typo "${typoMatch[0]}" at line ${line}. Expected "CREATE TABLE".`,
      line,
    });
    warnings.push(`Line ${line}: Syntax typo "${typoMatch[0]}".`);
  }

  // Regex to find CREATE TABLE statements
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)\s*\(/gi;
  let match: RegExpExecArray | null;

  interface IntermediateTable {
    name: string;
    line: number;
    rawBody: string;
    fields: (SchemaField & { line?: number })[];
    primaryKeys: Set<string>;
    uniqueKeys: Set<string>;
    relations: RawFkRelation[];
  }

  const parsedTables: IntermediateTable[] = [];
  const seenTableNames = new Map<string, number>();

  while ((match = createTableRegex.exec(cleanSql)) !== null) {
    const rawTableName = match[1];
    const tableName = cleanIdentifier(rawTableName);
    if (!tableName) continue;

    const tableLine = getLineNumber(sql, match.index);

    // Duplicate table name validation
    const lowerTableName = tableName.toLowerCase();
    if (seenTableNames.has(lowerTableName)) {
      diagnostics.push({
        severity: "error",
        message: `Duplicate table name "${tableName}" at line ${tableLine} (already defined at line ${seenTableNames.get(lowerTableName)}).`,
        line: tableLine,
        table: tableName,
      });
      warnings.push(`Line ${tableLine}: Duplicate table "${tableName}".`);
    } else {
      seenTableNames.set(lowerTableName, tableLine);
    }

    // Find the matching closing parenthesis for this table definition
    const openParenIndex = createTableRegex.lastIndex - 1;
    let parenDepth = 1;
    let inQuote = false;
    let quoteChar = "";
    let closeParenIndex = -1;

    for (let i = openParenIndex + 1; i < cleanSql.length; i++) {
      const ch = cleanSql[i];
      if (inQuote) {
        if (ch === quoteChar) {
          inQuote = false;
        }
      } else if (ch === '"' || ch === "'" || ch === "`") {
        inQuote = true;
        quoteChar = ch;
      } else if (ch === "(") {
        parenDepth++;
      } else if (ch === ")") {
        parenDepth--;
        if (parenDepth === 0) {
          closeParenIndex = i;
          break;
        }
      }
    }

    if (closeParenIndex === -1) {
      const openLine = getLineNumber(sql, openParenIndex);
      diagnostics.push({
        severity: "error",
        message: `Unclosed table definition for "${tableName}" starting at line ${openLine} (missing closing parenthesis).`,
        line: openLine,
        table: tableName,
      });
      warnings.push(`Line ${openLine}: Unclosed table definition for "${tableName}".`);
      continue;
    }

    // Advance regex pointer to avoid matching inside table body
    createTableRegex.lastIndex = closeParenIndex + 1;

    const body = cleanSql.slice(openParenIndex + 1, closeParenIndex);
    const definitions = splitDefinitions(body);

    const tableIntermediate: IntermediateTable = {
      name: tableName,
      line: tableLine,
      rawBody: body,
      fields: [],
      primaryKeys: new Set<string>(),
      uniqueKeys: new Set<string>(),
      relations: [],
    };

    // First pass: extract table-level constraints
    for (const def of definitions) {
      const trimmed = def.trim();
      const defOffset = cleanSql.indexOf(trimmed, openParenIndex);
      const defLine = defOffset !== -1 ? getLineNumber(sql, defOffset) : tableLine;

      // Check for table PRIMARY KEY (...)
      const pkMatch = trimmed.match(
        /(?:CONSTRAINT\s+[^\s]+\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)/i
      );
      if (pkMatch) {
        const cols = pkMatch[1].split(",").map((c) => cleanIdentifier(c));
        cols.forEach((c) => tableIntermediate.primaryKeys.add(c));
        continue;
      }

      // Check for table FOREIGN KEY (...) REFERENCES ...
      const fkMatch = trimmed.match(
        /(?:CONSTRAINT\s+[^\s]+\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([^\s(]+)(?:\s*\(([^)]+)\))?/i
      );
      if (fkMatch) {
        const sourceCol = cleanIdentifier(fkMatch[1].split(",")[0]);
        const targetTable = cleanIdentifier(fkMatch[2]);
        const targetCol = fkMatch[3] ? cleanIdentifier(fkMatch[3].split(",")[0]) : "id";
        tableIntermediate.relations.push({
          sourceTable: tableName,
          sourceCol,
          targetTable,
          targetCol,
          line: defLine,
        });
        continue;
      }

      // Check for table UNIQUE (...)
      const uqMatch = trimmed.match(
        /(?:CONSTRAINT\s+[^\s]+\s+)?UNIQUE\s*\(([^)]+)\)/i
      );
      if (uqMatch) {
        const cols = uqMatch[1].split(",").map((c) => cleanIdentifier(c));
        cols.forEach((c) => tableIntermediate.uniqueKeys.add(c));
        continue;
      }

      // Ignore standalone CHECK or INDEX constraints in column parsing
      if (/^(?:CONSTRAINT\s+[^\s]+\s+)?CHECK\s*\(/i.test(trimmed)) {
        continue;
      }
    }

    // Second pass: extract column definitions
    const seenColNames = new Map<string, number>();

    for (const def of definitions) {
      const trimmed = def.trim();
      const defOffset = cleanSql.indexOf(trimmed, openParenIndex);
      const defLine = defOffset !== -1 ? getLineNumber(sql, defOffset) : tableLine;

      // Skip table-level constraints
      if (
        /^(?:CONSTRAINT\s+[^\s]+\s+)?(?:PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK)\s*\(/i.test(
          trimmed
        )
      ) {
        continue;
      }

      // Match column name and remainder
      const colMatch = trimmed.match(/^([^\s]+)(?:\s+([\s\S]+))?$/);
      if (!colMatch) continue;

      const colName = cleanIdentifier(colMatch[1]);
      if (!colName || colName.toUpperCase() === "CONSTRAINT") continue;

      // Validate data type exists
      if (!colMatch[2] || colMatch[2].trim().length === 0) {
        diagnostics.push({
          severity: "error",
          message: `Column "${colName}" in table "${tableName}" is missing a data type at line ${defLine}.`,
          line: defLine,
          table: tableName,
          column: colName,
        });
        warnings.push(`Line ${defLine}: Column "${colName}" in table "${tableName}" is missing a data type.`);
      }

      // Duplicate column validation
      const lowerColName = colName.toLowerCase();
      if (seenColNames.has(lowerColName)) {
        diagnostics.push({
          severity: "error",
          message: `Duplicate column "${colName}" in table "${tableName}" at line ${defLine}.`,
          line: defLine,
          table: tableName,
          column: colName,
        });
        warnings.push(`Line ${defLine}: Duplicate column "${colName}" in table "${tableName}".`);
      } else {
        seenColNames.set(lowerColName, defLine);
      }

      const rest = colMatch[2] ? colMatch[2].trim() : "";

      // Extract raw data type (everything up to first modifier)
      const typeMatch = rest.match(
        /^([a-zA-Z0-9_]+(?:\s*\([^)]*\))?(?:\s+[a-zA-Z0-9_]+(?:\s*\([^)]*\))?)?)/i
      );
      const rawType = typeMatch ? typeMatch[1] : "VARCHAR";
      const schemaType = mapSqlTypeToSchemaType(rawType);

      const upperRest = rest.toUpperCase();
      const isPrimary =
        upperRest.includes("PRIMARY KEY") || tableIntermediate.primaryKeys.has(colName);
      const isUnique =
        upperRest.includes("UNIQUE") || tableIntermediate.uniqueKeys.has(colName);

      let isNullable = true;
      if (isPrimary) {
        isNullable = false;
      } else if (upperRest.includes("NOT NULL")) {
        isNullable = false;
      } else if (upperRest.includes("NULL")) {
        isNullable = true;
      }

      // Check for inline REFERENCES
      const inlineFkMatch = rest.match(
        /REFERENCES\s+([^\s(]+)(?:\s*\(([^)]+)\))?/i
      );
      if (inlineFkMatch) {
        const targetTable = cleanIdentifier(inlineFkMatch[1]);
        const targetCol = inlineFkMatch[2]
          ? cleanIdentifier(inlineFkMatch[2])
          : "id";
        tableIntermediate.relations.push({
          sourceTable: tableName,
          sourceCol: colName,
          targetTable,
          targetCol,
          line: defLine,
        });
      }

      tableIntermediate.fields.push({
        id: "",
        name: colName,
        type: schemaType,
        isPrimary,
        isNullable,
        isUnique,
        line: defLine,
      });
    }

    // Check if table has columns
    if (tableIntermediate.fields.length === 0) {
      diagnostics.push({
        severity: "warning",
        message: `Table "${tableName}" at line ${tableLine} has no column definitions.`,
        line: tableLine,
        table: tableName,
      });
      warnings.push(`Line ${tableLine}: Table "${tableName}" has no columns.`);
    } else if (!tableIntermediate.fields.some((f) => f.isPrimary)) {
      // Best practice: relational tables should have a Primary Key
      diagnostics.push({
        severity: "warning",
        message: `Table "${tableName}" at line ${tableLine} has no PRIMARY KEY defined.`,
        line: tableLine,
        table: tableName,
      });
      warnings.push(`Line ${tableLine}: Table "${tableName}" has no PRIMARY KEY.`);
    }

    parsedTables.push(tableIntermediate);
  }

  // Parse standalone ALTER TABLE ... ADD FOREIGN KEY statements
  const alterFkRegex =
    /ALTER\s+TABLE\s+([^\s]+)\s+ADD\s+(?:CONSTRAINT\s+[^\s]+\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([^\s(]+)(?:\s*\(([^)]+)\))?/gi;
  let alterMatch: RegExpExecArray | null;
  while ((alterMatch = alterFkRegex.exec(cleanSql)) !== null) {
    const rawSrcTable = alterMatch[1];
    const srcTable = cleanIdentifier(rawSrcTable);
    const srcCol = cleanIdentifier(alterMatch[2].split(",")[0]);
    const targetTable = cleanIdentifier(alterMatch[3]);
    const targetCol = alterMatch[4]
      ? cleanIdentifier(alterMatch[4].split(",")[0])
      : "id";
    const alterLine = getLineNumber(sql, alterMatch.index);

    const foundPt = parsedTables.find(
      (t) => t.name.toLowerCase() === srcTable.toLowerCase()
    );
    if (foundPt) {
      foundPt.relations.push({
        sourceTable: srcTable,
        sourceCol: srcCol,
        targetTable,
        targetCol,
        line: alterLine,
      });
    } else {
      diagnostics.push({
        severity: "error",
        message: `ALTER TABLE references non-existent table "${srcTable}" at line ${alterLine}.`,
        line: alterLine,
        table: srcTable,
      });
      warnings.push(
        `Line ${alterLine}: ALTER TABLE references non-existent table "${srcTable}".`
      );
    }
  }

  // Convert intermediate tables to SchemaTable[]
  const finalTables: SchemaTable[] = [];

  parsedTables.forEach((pt, index) => {
    const existingTable = existingTables.find(
      (t) => t.name.toLowerCase() === pt.name.toLowerCase()
    );

    const tableId =
      existingTable?.id ||
      `t_${pt.name.toLowerCase().replace(/[^a-z0-9_]/g, "") || "tbl"}_${Math.random()
        .toString(36)
        .slice(2, 6)}`;

    const position = existingTable?.position || {
      x: 60 + (index % 3) * 370,
      y: 60 + Math.floor(index / 3) * 310,
    };

    const finalFields: SchemaField[] = pt.fields.map((f) => {
      const existingField = existingTable?.fields.find(
        (ef) => ef.name.toLowerCase() === f.name.toLowerCase()
      );
      return {
        id:
          existingField?.id ||
          `f_${tableId}_${f.name.toLowerCase().replace(/[^a-z0-9_]/g, "")}_${Math.random()
            .toString(36)
            .slice(2, 6)}`,
        name: f.name,
        type: f.type,
        isPrimary: f.isPrimary,
        isNullable: f.isNullable,
        isUnique: f.isUnique,
        defaultValue: f.defaultValue,
      };
    });

    finalTables.push({
      id: tableId,
      name: pt.name,
      description: existingTable?.description || `Table for ${pt.name}`,
      position,
      fields: finalFields,
    });
  });

  // Wire up relations and validate foreign keys
  const finalRelations: SchemaRelation[] = [];
  const processedFkKeys = new Set<string>();

  for (const pt of parsedTables) {
    for (const rel of pt.relations) {
      const sourceTable = finalTables.find(
        (t) => t.name.toLowerCase() === rel.sourceTable.toLowerCase()
      );
      const targetTable = finalTables.find(
        (t) => t.name.toLowerCase() === rel.targetTable.toLowerCase()
      );

      if (!targetTable) {
        diagnostics.push({
          severity: "error",
          message: `Foreign key in table "${pt.name}.${rel.sourceCol}" references non-existent table "${rel.targetTable}" at line ${rel.line || pt.line}.`,
          line: rel.line || pt.line,
          table: pt.name,
          column: rel.sourceCol,
        });
        warnings.push(`Line ${rel.line || pt.line}: Table "${rel.targetTable}" referenced by foreign key does not exist.`);
        continue;
      }

      if (!sourceTable) continue;

      const sourceField = sourceTable.fields.find(
        (f) => f.name.toLowerCase() === rel.sourceCol.toLowerCase()
      );
      const targetField = targetTable.fields.find(
        (f) => f.name.toLowerCase() === rel.targetCol.toLowerCase()
      );

      if (!targetField) {
        diagnostics.push({
          severity: "error",
          message: `Foreign key in table "${pt.name}.${rel.sourceCol}" references unknown column "${rel.targetCol}" in table "${targetTable.name}" at line ${rel.line || pt.line}.`,
          line: rel.line || pt.line,
          table: pt.name,
          column: rel.sourceCol,
        });
        warnings.push(`Line ${rel.line || pt.line}: Column "${rel.targetCol}" referenced by foreign key does not exist in "${targetTable.name}".`);
        continue;
      }

      if (!sourceField) continue;

      const key = `${sourceTable.id}:${sourceField.id}->${targetTable.id}:${targetField.id}`;
      if (processedFkKeys.has(key)) continue;
      processedFkKeys.add(key);

      const existingRel = existingRelations.find(
        (r) =>
          r.sourceTableId === sourceTable.id &&
          r.sourceFieldId === sourceField.id &&
          r.targetTableId === targetTable.id &&
          r.targetFieldId === targetField.id
      );

      const relationType: RelationType = existingRel?.type || "1:N";

      finalRelations.push({
        id:
          existingRel?.id ||
          `rel_${sourceTable.id}_${sourceField.id}_${targetTable.id}`,
        sourceTableId: sourceTable.id,
        sourceFieldId: sourceField.id,
        targetTableId: targetTable.id,
        targetFieldId: targetField.id,
        type: relationType,
      });
    }
  }

  // Warn if no tables were found in non-empty SQL
  if (cleanSql.trim().length > 0 && finalTables.length === 0 && diagnostics.length === 0) {
    diagnostics.push({
      severity: "warning",
      message: "No CREATE TABLE statements found. Make sure to define tables with `CREATE TABLE <name> (...)`.",
      line: 1,
    });
    warnings.push("No CREATE TABLE statements found.");
  }

  const errors = diagnostics.filter((d) => d.severity === "error");
  const isValid = errors.length === 0;

  return {
    schema: {
      tables: finalTables,
      relations: finalRelations,
      customSql: sql,
    },
    tableCount: finalTables.length,
    relationCount: finalRelations.length,
    isValid,
    diagnostics,
    warnings,
    error: errors.length > 0 ? errors[0].message : undefined,
  };
}

/**
 * Formats a SQL DDL string with clean indentation and uppercase keywords.
 */
export function formatSql(sql: string): string {
  const lines = sql.split("\n");
  const formatted: string[] = [];
  let inTableDef = false;

  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line) {
      formatted.push("");
      continue;
    }

    if (line.startsWith("--") || line.startsWith("/*")) {
      formatted.push(line);
      continue;
    }

    // Capitalize common SQL DDL start keywords
    line = line
      .replace(/^create\s+table/i, "CREATE TABLE")
      .replace(/^create\s+index/i, "CREATE INDEX")
      .replace(/^create\s+type/i, "CREATE TYPE")
      .replace(/\s+if\s+not\s+exists\s+/i, " IF NOT EXISTS ")
      .replace(/\s+primary\s+key/i, " PRIMARY KEY")
      .replace(/\s+not\s+null/i, " NOT NULL")
      .replace(/\s+unique/i, " UNIQUE")
      .replace(/\s+foreign\s+key/i, " FOREIGN KEY")
      .replace(/\s+references\s+/i, " REFERENCES ")
      .replace(/\s+on\s+delete\s+cascade/i, " ON DELETE CASCADE")
      .replace(/\s+default\s+/i, " DEFAULT ");

    if (/^CREATE\s+TABLE/i.test(line)) {
      inTableDef = true;
      formatted.push(line);
    } else if (line.startsWith(");") || line === ")") {
      inTableDef = false;
      formatted.push(line);
    } else if (inTableDef) {
      formatted.push(`  ${line}`);
    } else {
      formatted.push(line);
    }
  }

  return formatted.join("\n");
}

/**
 * Quick templates for insertion into SQL editor
 */
export const SQL_SNIPPETS = {
  table: `CREATE TABLE IF NOT EXISTS "new_table" (
  "id" UUID PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);`,
  foreignKey: `  CONSTRAINT "fk_source_target" FOREIGN KEY ("source_id") REFERENCES "target_table"("id") ON DELETE CASCADE`,
  index: `CREATE INDEX IF NOT EXISTS "idx_table_column" ON "table_name" ("column_name");`,
  enumType: `CREATE TYPE "status_enum" AS ENUM ('active', 'pending', 'archived');`,
};
