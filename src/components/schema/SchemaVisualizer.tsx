"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  ProductSchema,
  SchemaTable,
  SchemaField,
  SchemaRelation,
  SchemaColumnType,
  RelationType,
  WorkspaceData,
} from "@/lib/types";
import { compileSqlSchema, compilePrismaSchema } from "@/lib/nx-compiler";
import { SqlSchemaEditor } from "./SqlSchemaEditor";
import { PrismaSchemaEditor } from "./PrismaSchemaEditor";
import {
  PlusIcon,
  XIcon,
  DatabaseIcon,
  KeyRoundIcon,
  GitBranchIcon,
  FileTextIcon,
  SparklesIcon,
  TrashIcon,
  ZoomInIcon,
  ZoomOutIcon,
  ExpandIcon,
  ShrinkIcon,
  ScanIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";

const TYPE_BADGE_STYLE: Record<SchemaColumnType, string> = {
  uuid: "text-lilac",
  string: "text-muted-foreground",
  text: "text-muted-foreground",
  int: "text-muted-foreground",
  float: "text-muted-foreground",
  boolean: "text-muted-foreground",
  datetime: "text-muted-foreground",
  json: "text-lilac",
};

interface SchemaVisualizerProps {
  data: WorkspaceData;
  onUpdateSchema: (schema: ProductSchema) => void;
  className?: string;
}

const COLUMN_TYPES: { value: SchemaColumnType; label: string }[] = [
  { value: "uuid", label: "UUID" },
  { value: "string", label: "String" },
  { value: "int", label: "Integer" },
  { value: "float", label: "Float" },
  { value: "boolean", label: "Boolean" },
  { value: "datetime", label: "DateTime" },
  { value: "json", label: "JSONB" },
  { value: "text", label: "Text" },
];

const TEMPLATES: { name: string; desc: string; schema: ProductSchema }[] = [
  {
    name: "SaaS & Subscriptions",
    desc: "Users, Accounts, Subscriptions & Audit Logs",
    schema: {
      tables: [
        {
          id: "t_users",
          name: "users",
          description: "Registered platform users",
          position: { x: 50, y: 50 },
          fields: [
            { id: "f_u1", name: "id", type: "uuid", isPrimary: true },
            { id: "f_u2", name: "email", type: "string", isUnique: true },
            { id: "f_u3", name: "full_name", type: "string", isNullable: true },
            { id: "f_u4", name: "created_at", type: "datetime" },
          ],
        },
        {
          id: "t_orgs",
          name: "organizations",
          description: "Teams and workspaces",
          position: { x: 420, y: 50 },
          fields: [
            { id: "f_o1", name: "id", type: "uuid", isPrimary: true },
            { id: "f_o2", name: "name", type: "string" },
            { id: "f_o3", name: "slug", type: "string", isUnique: true },
            { id: "f_o4", name: "created_at", type: "datetime" },
          ],
        },
        {
          id: "t_subs",
          name: "subscriptions",
          description: "Active billing plans and limits",
          position: { x: 790, y: 50 },
          fields: [
            { id: "f_s1", name: "id", type: "uuid", isPrimary: true },
            { id: "f_s2", name: "org_id", type: "uuid" },
            { id: "f_s3", name: "plan", type: "string" },
            { id: "f_s4", name: "status", type: "string" },
            { id: "f_s5", name: "current_period_end", type: "datetime" },
          ],
        },
      ],
      relations: [
        {
          id: "r_org_subs",
          sourceTableId: "t_subs",
          sourceFieldId: "f_s2",
          targetTableId: "t_orgs",
          targetFieldId: "f_o1",
          type: "1:1",
        },
      ],
    },
  },
  {
    name: "E-Commerce",
    desc: "Users, Products, Orders & Line Items",
    schema: {
      tables: [
        {
          id: "t_users",
          name: "users",
          position: { x: 50, y: 50 },
          fields: [
            { id: "f_u1", name: "id", type: "uuid", isPrimary: true },
            { id: "f_u2", name: "email", type: "string", isUnique: true },
            { id: "f_u3", name: "created_at", type: "datetime" },
          ],
        },
        {
          id: "t_orders",
          name: "orders",
          position: { x: 420, y: 50 },
          fields: [
            { id: "f_ord1", name: "id", type: "uuid", isPrimary: true },
            { id: "f_ord2", name: "user_id", type: "uuid" },
            { id: "f_ord3", name: "total_amount", type: "float" },
            { id: "f_ord4", name: "status", type: "string" },
            { id: "f_ord5", name: "created_at", type: "datetime" },
          ],
        },
        {
          id: "t_items",
          name: "order_items",
          position: { x: 790, y: 50 },
          fields: [
            { id: "f_oi1", name: "id", type: "uuid", isPrimary: true },
            { id: "f_oi2", name: "order_id", type: "uuid" },
            { id: "f_oi3", name: "product_title", type: "string" },
            { id: "f_oi4", name: "quantity", type: "int" },
            { id: "f_oi5", name: "unit_price", type: "float" },
          ],
        },
      ],
      relations: [
        {
          id: "r_user_orders",
          sourceTableId: "t_orders",
          sourceFieldId: "f_ord2",
          targetTableId: "t_users",
          targetFieldId: "f_u1",
          type: "1:N",
        },
        {
          id: "r_order_items",
          sourceTableId: "t_items",
          sourceFieldId: "f_oi2",
          targetTableId: "t_orders",
          targetFieldId: "f_ord1",
          type: "1:N",
        },
      ],
    },
  },
];

const TABLE_WIDTH = 300;

let idSequence = 1000;
function nextId(prefix: string): string {
  idSequence += 1;
  return `${prefix}_${Date.now()}_${idSequence}`;
}

interface DrawingArrowState {
  sourceTableId: string;
  sourceFieldId: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface DraggingTableState {
  tableId: string;
  startTableX: number;
  startTableY: number;
  startPointerClientX: number;
  startPointerClientY: number;
}

export function SchemaVisualizer({ data, onUpdateSchema, className }: SchemaVisualizerProps) {
  const schema: ProductSchema = useMemo(() => {
    return data.schema?.tables && data.schema.tables.length > 0
      ? data.schema
      : { tables: [], relations: [] };
  }, [data.schema]);

  const [activeTab, setActiveTab] = useState<"erd" | "sql" | "prisma">("erd");
  const [newTableName, setNewTableName] = useState("");
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Canvas Pan & Zoom State
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState(false);

  // Escape key to exit fullscreen workspace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMaximized) {
        setIsMaximized(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMaximized]);
  const panStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number } | null>(null);

  // Table Dragging State
  const [draggingTable, setDraggingTable] = useState<DraggingTableState | null>(null);
  const [dragPositions, setDragPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Arrow Interactive Drawing State
  const [drawingArrow, setDrawingArrow] = useState<DrawingArrowState | null>(null);
  const [hoveredTarget, setHoveredTarget] = useState<{ tableId: string; fieldId: string } | null>(null);
  const [hoveredRelationId, setHoveredRelationId] = useState<string | null>(null);

  // Container Ref
  const viewportRef = useRef<HTMLDivElement>(null);

  // Helper: Get table coordinates with fallback to grid
  const getTablePos = useCallback(
    (table: SchemaTable, index: number): { x: number; y: number } => {
      if (dragPositions[table.id]) return dragPositions[table.id];
      if (table.position && typeof table.position.x === "number" && typeof table.position.y === "number") {
        return table.position;
      }
      return {
        x: 60 + (index % 3) * 370,
        y: 60 + Math.floor(index / 3) * 310,
      };
    },
    [dragPositions]
  );

  // Convert Screen/Pointer client coordinates to Canvas World Coordinates
  const screenToWorld = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      if (!viewportRef.current) return { x: 0, y: 0 };
      const vRect = viewportRef.current.getBoundingClientRect();
      return {
        x: (clientX - vRect.left - pan.x) / zoom,
        y: (clientY - vRect.top - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  // Pure calculation of field socket world coordinates
  const getFieldSocketPos = useCallback(
    (tableId: string, fieldId: string, side: "left" | "right"): { x: number; y: number } => {
      const tableIndex = schema.tables.findIndex((t) => t.id === tableId);
      const table = schema.tables[tableIndex];
      if (!table) return { x: 0, y: 0 };
      const tPos = getTablePos(table, tableIndex);
      const fieldIndex = table.fields.findIndex((f) => f.id === fieldId);
      const rowY = tPos.y + 44 + Math.max(fieldIndex, 0) * 37 + 18.5;
      const rowX = side === "right" ? tPos.x + TABLE_WIDTH : tPos.x;
      return { x: rowX, y: rowY };
    },
    [getTablePos, schema.tables]
  );

  // Calculate Bezier Arrow Paths between tables
  const calculatedArrows = useMemo(() => {
    return schema.relations
      .map((rel) => {
        const sourceTableIndex = schema.tables.findIndex((t) => t.id === rel.sourceTableId);
        const targetTableIndex = schema.tables.findIndex((t) => t.id === rel.targetTableId);
        const sourceTable = schema.tables[sourceTableIndex];
        const targetTable = schema.tables[targetTableIndex];

        if (!sourceTable || !targetTable) return null;

        const sPos = getTablePos(sourceTable, sourceTableIndex);
        const tPos = getTablePos(targetTable, targetTableIndex);

        // Decide connection sockets based on relative table positions
        const isSourceLeft = sPos.x + TABLE_WIDTH / 2 < tPos.x + TABLE_WIDTH / 2;
        const sourceSide: "left" | "right" = isSourceLeft ? "right" : "left";
        const targetSide: "left" | "right" = isSourceLeft ? "left" : "right";

        const start = getFieldSocketPos(rel.sourceTableId, rel.sourceFieldId, sourceSide);
        const end = getFieldSocketPos(rel.targetTableId, rel.targetFieldId, targetSide);

        const dx = Math.max(Math.abs(end.x - start.x) * 0.45, 40);
        const cp1X = isSourceLeft ? start.x + dx : start.x - dx;
        const cp1Y = start.y;
        const cp2X = isSourceLeft ? end.x - dx : end.x + dx;
        const cp2Y = end.y;

        const d = `M ${start.x} ${start.y} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${end.x} ${end.y}`;

        // Accurate mathematical midpoint of cubic Bezier curve at t = 0.5
        const midX = 0.125 * start.x + 0.375 * cp1X + 0.375 * cp2X + 0.125 * end.x;
        const midY = 0.125 * start.y + 0.375 * cp1Y + 0.375 * cp2Y + 0.125 * end.y;

        return {
          id: rel.id,
          relation: rel,
          d,
          midX,
          midY,
          isSourceLeft,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [schema.relations, schema.tables, getTablePos, getFieldSocketPos]);

  // Handle Zoom controls
  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(2.0, Math.max(0.4, Number((prev + delta).toFixed(2)))));
  };

  const resetView = () => {
    setZoom(1.0);
    setPan({ x: 40, y: 40 });
  };

  const fitView = () => {
    if (schema.tables.length === 0 || !viewportRef.current) return;
    const vRect = viewportRef.current.getBoundingClientRect();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    schema.tables.forEach((t, i) => {
      const pos = getTablePos(t, i);
      const h = 48 + t.fields.length * 38;
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + TABLE_WIDTH);
      maxY = Math.max(maxY, pos.y + h);
    });

    const contentW = maxX - minX + 120;
    const contentH = maxY - minY + 120;
    const fitScale = Math.min(Math.max(Math.min(vRect.width / contentW, vRect.height / contentH), 0.5), 1.2);

    setZoom(Number(fitScale.toFixed(2)));
    setPan({
      x: (vRect.width - contentW * fitScale) / 2 - minX * fitScale + 60 * fitScale,
      y: (vRect.height - contentH * fitScale) / 2 - minY * fitScale + 60 * fitScale,
    });
  };

  // Canvas Panning Handlers
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    // Only pan if clicking canvas background (not table or buttons)
    const target = e.target as HTMLElement;
    if (target.closest("[data-table-card]") || target.closest("[data-canvas-control]")) return;

    setIsPanning(true);
    panStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (isPanning && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.clientX;
      const dy = e.clientY - panStartRef.current.clientY;
      setPan({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      });
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Canvas Wheel for Zoom & Pan
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = 1 - e.deltaY * 0.005;
      const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.4), 2.0);
      if (!viewportRef.current) return;
      const vRect = viewportRef.current.getBoundingClientRect();
      const mouseX = e.clientX - vRect.left;
      const mouseY = e.clientY - vRect.top;
      setPan({
        x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
        y: mouseY - (mouseY - pan.y) * (newZoom / zoom),
      });
      setZoom(Number(newZoom.toFixed(2)));
    } else {
      setPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  // Table Dragging Initiation
  const startDraggingTable = (tableId: string, e: React.PointerEvent) => {
    // Only drag when clicking table header, not inputs or buttons
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("select")) return;

    e.stopPropagation();
    const tableIndex = schema.tables.findIndex((t) => t.id === tableId);
    const table = schema.tables[tableIndex];
    if (!table) return;

    const currentPos = getTablePos(table, tableIndex);
    setDraggingTable({
      tableId,
      startTableX: currentPos.x,
      startTableY: currentPos.y,
      startPointerClientX: e.clientX,
      startPointerClientY: e.clientY,
    });
  };

  // Start Drawing Interactive Arrow from Socket
  const startDrawingArrow = (tableId: string, fieldId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startPoint = getFieldSocketPos(tableId, fieldId, "right");
    setDrawingArrow({
      sourceTableId: tableId,
      sourceFieldId: fieldId,
      startX: startPoint.x,
      startY: startPoint.y,
      currentX: startPoint.x,
      currentY: startPoint.y,
    });
  };

  // Global window listeners for smooth dragging & arrow drawing
  useEffect(() => {
    const handleWindowPointerMove = (e: PointerEvent) => {
      // 1. Table Dragging
      if (draggingTable) {
        const dx = (e.clientX - draggingTable.startPointerClientX) / zoom;
        const dy = (e.clientY - draggingTable.startPointerClientY) / zoom;
        const newX = Math.round(draggingTable.startTableX + dx);
        const newY = Math.round(draggingTable.startTableY + dy);

        setDragPositions((prev) => ({
          ...prev,
          [draggingTable.tableId]: { x: newX, y: newY },
        }));
      }

      // 2. Interactive Arrow Drawing
      if (drawingArrow) {
        const worldPos = screenToWorld(e.clientX, e.clientY);
        setDrawingArrow((prev) => (prev ? { ...prev, currentX: worldPos.x, currentY: worldPos.y } : null));

        // Check hovered element
        const elem = document.elementFromPoint(e.clientX, e.clientY);
        const rowEl = elem?.closest("[data-field-id]");
        if (rowEl) {
          const tId = rowEl.getAttribute("data-table-id");
          const fId = rowEl.getAttribute("data-field-id");
          if (tId && fId && tId !== drawingArrow.sourceTableId) {
            setHoveredTarget({ tableId: tId, fieldId: fId });
            return;
          }
        }
        setHoveredTarget(null);
      }
    };

    const handleWindowPointerUp = () => {
      // End Table Dragging
      if (draggingTable) {
        const finalPos = dragPositions[draggingTable.tableId];
        if (finalPos) {
          const nextTables = schema.tables.map((t) =>
            t.id === draggingTable.tableId ? { ...t, position: finalPos } : t
          );
          onUpdateSchema({ ...schema, tables: nextTables });
        }
        setDraggingTable(null);
      }

      // End Interactive Arrow Drawing
      if (drawingArrow) {
        if (hoveredTarget && hoveredTarget.tableId !== drawingArrow.sourceTableId) {
          const sourceTable = schema.tables.find((t) => t.id === drawingArrow.sourceTableId);
          const targetTable = schema.tables.find((t) => t.id === hoveredTarget.tableId);
          const sourceField = sourceTable?.fields.find((f) => f.id === drawingArrow.sourceFieldId);
          const targetField = targetTable?.fields.find((f) => f.id === hoveredTarget.fieldId);

          if (sourceTable && targetTable && sourceField && targetField) {
            // RDBMS Direction: If target has PK and source doesn't, source is Foreign Key pointing to Target PK
            let relSourceTable = sourceTable.id;
            let relSourceField = sourceField.id;
            let relTargetTable = targetTable.id;
            let relTargetField = targetField.id;

            if (sourceField.isPrimary && !targetField.isPrimary) {
              // Reversed: Target is foreign key pointing to source PK
              relSourceTable = targetTable.id;
              relSourceField = targetField.id;
              relTargetTable = sourceTable.id;
              relTargetField = sourceField.id;
            }

            // Check if relationship already exists
            const alreadyExists = schema.relations.some(
              (r) =>
                r.sourceTableId === relSourceTable &&
                r.sourceFieldId === relSourceField &&
                r.targetTableId === relTargetTable &&
                r.targetFieldId === relTargetField
            );

            if (!alreadyExists) {
              const newRel: SchemaRelation = {
                id: nextId("r"),
                sourceTableId: relSourceTable,
                sourceFieldId: relSourceField,
                targetTableId: relTargetTable,
                targetFieldId: relTargetField,
                type: "1:N",
              };
              onUpdateSchema({
                ...schema,
                relations: [...schema.relations, newRel],
              });
            }
          }
        }
        setDrawingArrow(null);
        setHoveredTarget(null);
      }
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
    };
  }, [
    draggingTable,
    dragPositions,
    drawingArrow,
    hoveredTarget,
    onUpdateSchema,
    schema,
    screenToWorld,
    zoom,
  ]);

  // Table Management
  const addTable = () => {
    const name = newTableName.trim().toLowerCase().replace(/\s+/g, "_");
    if (!name) return;

    if (schema.tables.some((t) => t.name.toLowerCase() === name)) {
      alert(`Table '${name}' already exists.`);
      return;
    }

    const newTable: SchemaTable = {
      id: nextId("t"),
      name,
      fields: [
        { id: nextId("f"), name: "id", type: "uuid", isPrimary: true, isNullable: false },
        { id: nextId("f"), name: "created_at", type: "datetime" },
      ],
      position: {
        x: 60 + (schema.tables.length % 3) * 360,
        y: 60 + Math.floor(schema.tables.length / 3) * 300,
      },
    };

    onUpdateSchema({
      ...schema,
      tables: [...schema.tables, newTable],
    });
    setNewTableName("");
    setIsAddingTable(false);
  };

  const deleteTable = (tableId: string) => {
    const table = schema.tables.find((t) => t.id === tableId);
    const incomingRelations = schema.relations.filter((r) => r.targetTableId === tableId);

    if (incomingRelations.length > 0) {
      const confirmDelete = window.confirm(
        `Table '${table?.name}' is referenced by ${incomingRelations.length} foreign key relationship(s). Deleting it will also remove those relationships. Continue?`
      );
      if (!confirmDelete) return;
    }

    const nextTables = schema.tables.filter((t) => t.id !== tableId);
    const nextRelations = schema.relations.filter(
      (r) => r.sourceTableId !== tableId && r.targetTableId !== tableId
    );
    onUpdateSchema({ tables: nextTables, relations: nextRelations });
  };

  // Field Management with strict RDBMS Rules
  const addField = (tableId: string) => {
    const nextTables = schema.tables.map((t) => {
      if (t.id !== tableId) return t;
      const fieldCount = t.fields.length + 1;
      const newField: SchemaField = {
        id: nextId("f"),
        name: `field_${fieldCount}`,
        type: "string",
      };
      return { ...t, fields: [...t.fields, newField] };
    });
    onUpdateSchema({ ...schema, tables: nextTables });
  };

  const updateField = (tableId: string, fieldId: string, patch: Partial<SchemaField>) => {
    const table = schema.tables.find((t) => t.id === tableId);
    if (!table) return;
    const field = table.fields.find((f) => f.id === fieldId);
    if (!field) return;

    // RDBMS Rule 1: Cannot uncheck Primary Key if it's the sole PK
    if (patch.isPrimary === false && field.isPrimary) {
      const pkCount = table.fields.filter((f) => f.isPrimary).length;
      if (pkCount <= 1) {
        alert("RDBMS Constraint: A relational table must have at least one Primary Key. Assign PK to another column first.");
        return;
      }
      // RDBMS Rule 2: Cannot remove PK if actively referenced as foreign key target
      const isReferenced = schema.relations.some((r) => r.targetFieldId === fieldId);
      if (isReferenced) {
        alert("RDBMS Constraint: Cannot remove Primary Key from this column because it is actively referenced by a Foreign Key relationship.");
        return;
      }
    }

    // When setting isPrimary to true, automatically enforce not nullable
    if (patch.isPrimary === true) {
      patch.isNullable = false;
    }

    const nextTables = schema.tables.map((t) => {
      if (t.id !== tableId) return t;
      return {
        ...t,
        fields: t.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)),
      };
    });
    onUpdateSchema({ ...schema, tables: nextTables });
  };

  const deleteField = (tableId: string, fieldId: string) => {
    const table = schema.tables.find((t) => t.id === tableId);
    if (!table) return;
    const field = table.fields.find((f) => f.id === fieldId);
    if (!field) return;

    // RDBMS Rule 1: Cannot delete sole Primary Key
    if (field.isPrimary) {
      const pkCount = table.fields.filter((f) => f.isPrimary).length;
      if (pkCount <= 1) {
        alert("RDBMS Constraint: A table must have at least one Primary Key. You cannot delete the sole Primary Key of a table.");
        return;
      }
    }

    // RDBMS Rule 2: Cannot delete column referenced as Foreign Key target
    const referencingRelations = schema.relations.filter((r) => r.targetFieldId === fieldId);
    if (referencingRelations.length > 0) {
      alert("RDBMS Constraint: Cannot delete this column because it is actively referenced as a Foreign Key in another table. Remove the relationship first.");
      return;
    }

    const nextTables = schema.tables.map((t) => {
      if (t.id !== tableId) return t;
      return { ...t, fields: t.fields.filter((f) => f.id !== fieldId) };
    });
    // Prune outgoing relations originating from this field
    const nextRelations = schema.relations.filter((r) => r.sourceFieldId !== fieldId);
    onUpdateSchema({ tables: nextTables, relations: nextRelations });
  };

  // Toggle or cycle relation type (1:N -> 1:1 -> N:N -> 1:N)
  const cycleRelationType = (relId: string) => {
    const nextRelations = schema.relations.map((r) => {
      if (r.id !== relId) return r;
      const nextType: RelationType = r.type === "1:N" ? "1:1" : r.type === "1:1" ? "N:N" : "1:N";
      return { ...r, type: nextType };
    });
    onUpdateSchema({ ...schema, relations: nextRelations });
  };

  const deleteRelation = (relId: string) => {
    onUpdateSchema({
      ...schema,
      relations: schema.relations.filter((r) => r.id !== relId),
    });
  };

  const loadTemplate = (tmplSchema: ProductSchema) => {
    onUpdateSchema(tmplSchema);
  };

  const compiledSql = useMemo(() => compileSqlSchema(data), [data]);
  const compiledPrisma = useMemo(() => compilePrismaSchema(data), [data]);

  const generateFreshSqlFromErd = useCallback(() => {
    const pureData = {
      ...data,
      schema: {
        tables: schema.tables,
        relations: schema.relations,
        customSql: undefined,
      },
    };
    return compileSqlSchema(pureData);
  }, [data, schema.tables, schema.relations]);

  const generateFreshPrismaFromErd = useCallback(() => {
    const pureData = {
      ...data,
      schema: {
        tables: schema.tables,
        relations: schema.relations,
        customPrisma: undefined,
      },
    };
    return compilePrismaSchema(pureData);
  }, [data, schema.tables, schema.relations]);

  return (
    <div
      className={cn(
        isMaximized
          ? "fixed inset-0 z-50 flex flex-col bg-background/98 p-4 sm:p-6 overflow-hidden backdrop-blur-xl animate-in fade-in duration-200"
          : "relative rounded-2xl border border-border/80 bg-card/40 p-4 sm:p-6 shadow-sm transition-all",
        className
      )}
    >
      {/* Header / Mode Switcher */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <DatabaseIcon className="h-4 w-4 text-lilac shrink-0" />
          <h3 className="text-sm font-semibold text-foreground">Data Schema</h3>
          <span className="text-xs text-muted-foreground font-mono">
            · {schema.tables.length} {schema.tables.length === 1 ? "table" : "tables"}
            {schema.relations.length > 0 && ` · ${schema.relations.length} rel`}
          </span>
        </div>

        {/* Tabs & Top Controls */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-secondary/40 p-0.5">
            <button
              onClick={() => setActiveTab("erd")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTab === "erd"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <GitBranchIcon className="h-3 w-3" />
              Canvas
            </button>
            <button
              onClick={() => setActiveTab("sql")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTab === "sql"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileTextIcon className="h-3 w-3" />
              SQL
            </button>
            <button
              onClick={() => setActiveTab("prisma")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTab === "prisma"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileTextIcon className="h-3 w-3" />
              Prisma
            </button>
          </div>

          {activeTab === "erd" && schema.tables.length > 0 && (
            <button
              onClick={() => setIsAddingTable(true)}
              className="flex items-center gap-1 rounded-lg border border-border bg-secondary/40 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all shadow-2xs"
              title="Add new schema table"
            >
              <PlusIcon className="h-3.5 w-3.5 text-lilac" />
              <span className="hidden sm:inline">Add Table</span>
            </button>
          )}

          {/* Full Space Toggle */}
          <button
            onClick={() => setIsMaximized((prev) => !prev)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all shadow-2xs",
              isMaximized
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
            title={isMaximized ? "Exit Full Space (Esc)" : "Full Space"}
          >
            {isMaximized ? (
              <ShrinkIcon className="h-3.5 w-3.5" />
            ) : (
              <ExpandIcon className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="hidden sm:inline">
              {isMaximized ? "Exit" : "Full Space"}
            </span>
          </button>
        </div>
      </div>

      {/* Template Quick Loader (when empty) */}
      {schema.tables.length === 0 && activeTab === "erd" && (
        <div className="my-8 rounded-xl border border-dashed border-border p-8 text-center bg-secondary/20">
          <DatabaseIcon className="mx-auto h-7 w-7 text-muted-foreground/50" />
          <h4 className="mt-2 text-sm font-medium text-foreground">
            No tables defined yet
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Load a starter template or create a custom table.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                onClick={() => loadTemplate(tmpl.schema)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-lilac/50 transition-all shadow-xs"
              >
                <SparklesIcon className="h-3 w-3 text-lilac" />
                {tmpl.name}
              </button>
            ))}
            <button
              onClick={() => setIsAddingTable(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-lilac/40 bg-lilac/10 px-3 py-1.5 text-xs font-medium text-lilac hover:bg-lilac/20 transition-all"
            >
              <PlusIcon className="h-3 w-3" />
              New Table
            </button>
          </div>

          {isAddingTable && (
            <div className="mt-4 flex items-center justify-center gap-2 max-w-sm mx-auto animate-in fade-in-50 duration-150">
              <input
                type="text"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="Table name (e.g. users)..."
                className="h-8 flex-1 rounded-lg border border-lilac/60 bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-lilac font-mono"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") addTable();
                  if (e.key === "Escape") {
                    setIsAddingTable(false);
                    setNewTableName("");
                  }
                }}
              />
              <button
                onClick={addTable}
                disabled={!newTableName.trim()}
                className="h-8 rounded-lg bg-lilac px-3 text-xs font-semibold text-white hover:bg-lilac/90 transition-all disabled:opacity-40"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsAddingTable(false);
                  setNewTableName("");
                }}
                className="h-8 rounded-lg border border-border bg-card px-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Tab 1: Visual Interactive ERD Canvas */}
      {activeTab === "erd" && schema.tables.length > 0 && (
        <div className={cn("relative mt-5", isMaximized && "flex-1 flex flex-col min-h-0 mt-3")}>
          {/* Canvas Viewport */}
          <div
            ref={viewportRef}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onWheel={handleWheel}
            style={{
              backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`,
            }}
            className={cn(
              "relative w-full rounded-2xl border border-border/80 bg-card/20 shadow-inner overflow-hidden select-none transition-all",
              isMaximized
                ? "flex-1 h-full min-h-[450px]"
                : "h-[740px] lg:h-[calc(100vh-270px)] min-h-[620px]",
              "bg-[radial-gradient(#94a3b8_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#3f3f46_1.3px,transparent_1.3px)]",
              isPanning ? "cursor-grabbing" : drawingArrow ? "cursor-crosshair" : "cursor-default"
            )}
          >
            {/* World Coordinate Plane */}
            <div
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "0 0",
              }}
            >
              {/* SVG Relationship Layer */}
              <svg className="absolute inset-0 h-full w-full overflow-visible pointer-events-none z-10">
                <defs>
                  <marker
                    id="erd-arrow-end"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--lilac, #C4B5FD)" />
                  </marker>
                  <marker
                    id="erd-arrow-end-active"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ffffff" />
                  </marker>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#C4B5FD" floodOpacity="0.4" />
                  </filter>
                </defs>

                {/* Established Relations */}
                {calculatedArrows.map(({ id, d, midX, midY, relation }) => {
                  const isHovered = hoveredRelationId === id;
                  return (
                    <g key={id} className="transition-all">
                      {/* Wider invisible hit area for easy hover/click */}
                      <path
                        d={d}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="18"
                        className="pointer-events-auto cursor-pointer"
                        onMouseEnter={() => setHoveredRelationId(id)}
                        onMouseLeave={() => setHoveredRelationId((curr) => (curr === id ? null : curr))}
                        onClick={() => cycleRelationType(id)}
                      />
                      {/* Visible schematic wire */}
                      <path
                        d={d}
                        fill="none"
                        stroke={isHovered ? "#ffffff" : "var(--lilac, #C4B5FD)"}
                        strokeWidth={isHovered ? "2" : "1.5"}
                        strokeDasharray={isHovered ? "none" : "5 3"}
                        markerEnd={isHovered ? "url(#erd-arrow-end-active)" : "url(#erd-arrow-end)"}
                        filter={isHovered ? "url(#glow)" : undefined}
                        className="transition-all duration-150"
                      />
                      {/* Midpoint interactive badge */}
                      <g
                        transform={`translate(${midX}, ${midY})`}
                        className="pointer-events-auto cursor-pointer"
                        onMouseEnter={() => setHoveredRelationId(id)}
                        onMouseLeave={() => setHoveredRelationId((curr) => (curr === id ? null : curr))}
                      >
                        <rect
                          x={-28}
                          y={-11}
                          width={56}
                          height={22}
                          rx={6}
                          fill="var(--card)"
                          stroke={isHovered ? "var(--lilac, #C4B5FD)" : "var(--border)"}
                          strokeWidth="1"
                          className="shadow-sm transition-all"
                        />
                        <text
                          x={isHovered ? -8 : 0}
                          y={3}
                          textAnchor="middle"
                          fill={isHovered ? "var(--lilac, #C4B5FD)" : "currentColor"}
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                          className="select-none"
                          onClick={() => cycleRelationType(id)}
                        >
                          {relation.type}
                        </text>
                        {isHovered && (
                          <g
                            transform="translate(14, -6)"
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRelation(id);
                            }}
                          >
                            <circle cx="5" cy="5" r="6" fill="var(--foreground)" />
                            <text
                              x="5"
                              y="8"
                              textAnchor="middle"
                              fill="var(--background)"
                              fontSize="9"
                              fontWeight="bold"
                            >
                              ×
                            </text>
                          </g>
                        )}
                      </g>
                    </g>
                  );
                })}

                {/* Live Drawing Arrow Spline */}
                {drawingArrow && (
                  <path
                    d={`M ${drawingArrow.startX} ${drawingArrow.startY} C ${
                      drawingArrow.startX + Math.max(Math.abs(drawingArrow.currentX - drawingArrow.startX) * 0.45, 35)
                    } ${drawingArrow.startY}, ${
                      drawingArrow.currentX - Math.max(Math.abs(drawingArrow.currentX - drawingArrow.startX) * 0.45, 35)
                    } ${drawingArrow.currentY}, ${drawingArrow.currentX} ${drawingArrow.currentY}`}
                    fill="none"
                    stroke="var(--lilac, #C4B5FD)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    markerEnd="url(#erd-arrow-end-active)"
                    filter="url(#glow)"
                  />
                )}
              </svg>

              {/* Table Cards Layer */}
              <div className="absolute inset-0">
                {schema.tables.map((table, tIndex) => {
                  const pos = getTablePos(table, tIndex);
                  const isBeingDragged = draggingTable?.tableId === table.id;
                  const primaryCount = table.fields.filter((f) => f.isPrimary).length;

                  return (
                    <div
                      key={table.id}
                      data-table-card
                      style={{
                        transform: `translate(${pos.x}px, ${pos.y}px)`,
                        width: TABLE_WIDTH,
                      }}
                      className={cn(
                        "absolute rounded-2xl border border-border/80 bg-card/95 shadow-lg backdrop-blur-md transition-shadow pointer-events-auto select-none",
                        isBeingDragged && "shadow-2xl ring-2 ring-primary/40 z-30",
                        !isBeingDragged && "hover:border-primary/50 hover:shadow-xl z-20"
                      )}
                    >
                      {/* Table Header (Drag Handle) */}
                      <div
                        onPointerDown={(e) => startDraggingTable(table.id, e)}
                        className={cn(
                          "flex items-center justify-between border-b border-border/70 bg-secondary/60 px-3.5 py-2.5 rounded-t-2xl cursor-grab active:cursor-grabbing",
                          "transition-colors hover:bg-secondary/80"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-1.5 w-1.5 rounded-full bg-lilac shrink-0" />
                          <input
                            type="text"
                            value={table.name}
                            onChange={(e) => {
                              const newName = e.target.value.toLowerCase().replace(/\s+/g, "_");
                              const nextTables = schema.tables.map((t) =>
                                t.id === table.id ? { ...t, name: newName } : t
                              );
                              onUpdateSchema({ ...schema, tables: nextTables });
                            }}
                            className="font-mono text-xs font-bold text-foreground tracking-tight bg-transparent border-none outline-none truncate w-32 focus:bg-background/80 focus:px-1 rounded"
                            title="Click to rename table"
                          />
                          <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground border border-border/50 shrink-0">
                            {table.fields.length} cols
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addField(table.id);
                            }}
                            title="Add column"
                            aria-label="Add column"
                            className="rounded-lg p-1 text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
                          >
                            <PlusIcon className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTable(table.id);
                            }}
                            title="Delete table"
                            aria-label="Delete table"
                            className="rounded-lg p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Field Rows with Connector Ports */}
                      <div className="divide-y divide-border/30 p-2 space-y-0.5">
                        {table.fields.map((field) => {
                          const isSolePk = field.isPrimary && primaryCount <= 1;
                          const isReferencedByFk = schema.relations.some((r) => r.targetFieldId === field.id);
                          const isFk = schema.relations.some(
                            (r) => r.sourceTableId === table.id && r.sourceFieldId === field.id
                          );
                          const isHighlightedTarget =
                            hoveredTarget?.tableId === table.id && hoveredTarget?.fieldId === field.id;

                          return (
                            <div
                              key={field.id}
                              data-table-id={table.id}
                              data-field-id={field.id}
                              className={cn(
                                "group/row relative flex items-center justify-between gap-1.5 py-1.5 px-2 rounded-lg transition-all",
                                isHighlightedTarget
                                  ? "bg-primary/20 ring-2 ring-primary"
                                  : "hover:bg-secondary/40"
                              )}
                            >
                              {/* Left Socket (Receive Target / FK connection) */}
                              <div
                                onPointerDown={(e) => startDrawingArrow(table.id, field.id, e)}
                                title="Drag arrow to link column"
                                className={cn(
                                  "absolute -left-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background shadow-xs z-30 cursor-crosshair transition-all",
                                  "opacity-0 group-hover/row:opacity-100 hover:scale-125 hover:bg-primary",
                                  drawingArrow && "opacity-80 scale-110 ring-2 ring-primary/40"
                                )}
                              />

                              {/* Column Name & Role */}
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                {field.isPrimary ? (
                                  <span title="Primary Key" className="shrink-0 text-lilac">
                                    <KeyRoundIcon className="h-3 w-3" />
                                  </span>
                                ) : isFk ? (
                                  <span
                                    title="Foreign Key (Referencing another table)"
                                    className="shrink-0 font-mono text-[9px] font-semibold text-lilac"
                                  >
                                    FK
                                  </span>
                                ) : (
                                  <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-muted-foreground/30 ml-0.5 mr-1" />
                                )}
                                <input
                                  type="text"
                                  value={field.name}
                                  onChange={(e) => updateField(table.id, field.id, { name: e.target.value })}
                                  className="font-mono text-xs font-medium text-foreground bg-transparent border-none outline-none w-full truncate focus:bg-background/80 focus:px-1 rounded"
                                />
                              </div>

                              {/* Column Type & Actions */}
                              <div className="flex items-center gap-1 shrink-0">
                                <select
                                  value={field.type}
                                  onChange={(e) =>
                                    updateField(table.id, field.id, {
                                      type: e.target.value as SchemaColumnType,
                                    })
                                  }
                                  className={cn(
                                    "h-5 bg-transparent border-none px-1 text-[10px] font-mono font-medium outline-none transition-colors cursor-pointer",
                                    TYPE_BADGE_STYLE[field.type] ?? "text-muted-foreground"
                                  )}
                                >
                                  {COLUMN_TYPES.map((ct) => (
                                    <option key={ct.value} value={ct.value} className="bg-popover text-popover-foreground">
                                      {ct.label}
                                    </option>
                                  ))}
                                </select>

                                {/* Primary Key Toggle Button */}
                                <button
                                  onClick={() => {
                                    if (field.isPrimary && (isSolePk || isReferencedByFk)) {
                                      alert(
                                        isSolePk
                                          ? "RDBMS Principle: A table must have at least one Primary Key. Assign PK to another column first."
                                          : "RDBMS Principle: Cannot remove PK from this column because it is actively referenced by a Foreign Key."
                                      );
                                      return;
                                    }
                                    updateField(table.id, field.id, { isPrimary: !field.isPrimary });
                                  }}
                                  disabled={field.isPrimary && (isSolePk || isReferencedByFk)}
                                  title={
                                    field.isPrimary
                                      ? isSolePk
                                        ? "Sole Primary Key (Mandatory)"
                                        : isReferencedByFk
                                        ? "Primary Key (Referenced by Foreign Key)"
                                        : "Primary Key"
                                      : "Make Primary Key"
                                  }
                                  aria-label={
                                    field.isPrimary
                                      ? isSolePk
                                        ? "Sole Primary Key (Mandatory)"
                                        : isReferencedByFk
                                        ? "Primary Key (Referenced by Foreign Key)"
                                        : "Primary Key"
                                      : "Make Primary Key"
                                  }
                                  className={cn(
                                    "px-1 text-[9px] font-mono font-semibold transition-colors",
                                    field.isPrimary
                                      ? "text-lilac"
                                      : "text-muted-foreground/30 hover:text-muted-foreground",
                                    field.isPrimary && (isSolePk || isReferencedByFk) && "cursor-not-allowed opacity-80"
                                  )}
                                >
                                  PK
                                </button>

                                {/* Delete Column Button */}
                                <button
                                  onClick={() => {
                                    if (isSolePk) {
                                      alert("RDBMS Principle: A table must have at least one Primary Key. Assign PK to another column before deleting this one.");
                                      return;
                                    }
                                    if (isReferencedByFk) {
                                      alert("RDBMS Principle: Cannot delete column referenced by a Foreign Key relationship.");
                                      return;
                                    }
                                    deleteField(table.id, field.id);
                                  }}
                                  disabled={isSolePk || isReferencedByFk}
                                  title={
                                    isSolePk
                                      ? "Cannot delete: Sole Primary Key of table"
                                      : isReferencedByFk
                                      ? "Cannot delete: Referenced by a Foreign Key"
                                      : "Delete column"
                                  }
                                  aria-label={
                                    isSolePk
                                      ? "Cannot delete the only Primary Key"
                                      : isReferencedByFk
                                      ? "Cannot delete column referenced by Foreign Key"
                                      : "Delete column"
                                  }
                                  className={cn(
                                    "p-0.5 text-muted-foreground transition-opacity",
                                    isSolePk || isReferencedByFk
                                      ? "opacity-20 cursor-not-allowed"
                                      : "opacity-0 group-hover/row:opacity-100 hover:text-red-400"
                                  )}
                                >
                                  <XIcon className="h-3 w-3" />
                                </button>
                              </div>

                              {/* Right Socket (Source / Output Handle) */}
                              <div
                                onPointerDown={(e) => startDrawingArrow(table.id, field.id, e)}
                                title="Drag arrow to connect to target table"
                                className={cn(
                                  "absolute -right-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background shadow-xs z-30 cursor-crosshair transition-all",
                                  "opacity-0 group-hover/row:opacity-100 hover:scale-125 hover:bg-primary",
                                  drawingArrow && "opacity-80 scale-110 ring-2 ring-primary/40"
                                )}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Floating Canvas Dock (anchored strictly inside canvas viewport) */}
            <div
              data-canvas-control
              className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded-full border border-border/80 bg-background/90 p-1 px-2 shadow-xl backdrop-blur-md transition-all select-none max-w-[calc(100%-24px)] pointer-events-auto"
            >
              {isAddingTable ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addTable();
                  }}
                  className="flex items-center gap-1.5 px-1 py-0.5"
                >
                  <input
                    type="text"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    placeholder="Table name..."
                    className="h-7 w-32 sm:w-44 rounded-full border border-lilac/60 bg-background px-3 text-xs font-mono outline-none focus:ring-1 focus:ring-lilac shadow-2xs"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setIsAddingTable(false);
                        setNewTableName("");
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!newTableName.trim()}
                    className="h-7 rounded-full bg-lilac px-3 text-xs font-semibold text-white hover:bg-lilac/90 transition-all disabled:opacity-40"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingTable(false);
                      setNewTableName("");
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    title="Cancel (Esc)"
                    aria-label="Cancel (Esc)"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </form>
              ) : (
                <>
                  {/* Zoom Controls */}
                  <button
                    type="button"
                    onClick={() => handleZoom(-0.15)}
                    title="Zoom out (-)"
                    aria-label="Zoom out (-)"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    <ZoomOutIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={resetView}
                    title="Reset zoom to 100%"
                    aria-label="Reset zoom to 100%"
                    className="px-1.5 text-center font-mono text-[11px] font-medium text-foreground hover:text-lilac transition-colors"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleZoom(0.15)}
                    title="Zoom in (+)"
                    aria-label="Zoom in (+)"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    <ZoomInIcon className="h-3.5 w-3.5" />
                  </button>

                  <div className="h-3.5 w-px bg-border/80 mx-0.5" />

                  {/* Fit View */}
                  <button
                    type="button"
                    onClick={fitView}
                    title="Fit all tables into view"
                    aria-label="Fit all tables into view"
                    className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    <ScanIcon className="h-3 w-3 text-lilac" />
                    <span className="text-[11px] font-medium">Fit</span>
                  </button>

                  <div className="h-3.5 w-px bg-border/80 mx-0.5" />

                  {/* Add Table */}
                  <button
                    type="button"
                    onClick={() => setIsAddingTable(true)}
                    className="flex items-center gap-1 rounded-full bg-secondary/80 hover:bg-secondary border border-border/80 px-2.5 py-1 text-xs font-medium text-foreground transition-all shadow-2xs hover:border-lilac/40"
                    title="Add a new schema table"
                    aria-label="Add a new schema table"
                  >
                    <PlusIcon className="h-3 w-3 text-lilac" />
                    <span className="text-[11px]">Table</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Tab 2: SQL DDL Editor */}
      {activeTab === "sql" && (
        <SqlSchemaEditor
          initialSql={compiledSql}
          tables={schema.tables}
          relations={schema.relations}
          onApplySchema={onUpdateSchema}
          onResetFromErd={generateFreshSqlFromErd}
          isMaximized={isMaximized}
        />
      )}

      {/* Main Tab 3: Prisma Schema Editor */}
      {activeTab === "prisma" && (
        <PrismaSchemaEditor
          initialPrisma={compiledPrisma}
          currentSchema={schema}
          onApplyPrisma={onUpdateSchema}
          onResetFromErd={generateFreshPrismaFromErd}
          isMaximized={isMaximized}
        />
      )}
    </div>
  );
}
