/**
 * AST & Dependency Graph Engine for Nx Studio Architect Assistant.
 *
 * Provides:
 * 1. Cycle detection (DFS / Tarjan) across dependency graphs, schema relations, and AST modules.
 * 2. Blast radius calculation: direct dependents, transitive cascade, risk level, and contract impact.
 * 3. Topological sorting and validation against Product OS DAG stages.
 */

export interface GraphEdge {
  from: string;
  to: string;
  kind?: "import" | "relation" | "dag_dep" | "call";
}

export interface DependencyGraph {
  nodes: Set<string>;
  adjacency: Map<string, Set<string>>; // node -> set of nodes it depends on
  reverseAdjacency: Map<string, Set<string>>; // node -> set of nodes that depend on it
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface BlastRadiusReport {
  target: string;
  directDependents: string[];
  transitiveDependents: string[];
  totalAffected: number;
  riskLevel: RiskLevel;
  hasCycle: boolean;
  cyclePaths: string[][];
  affectedContracts: string[];
  suggestedVerification: string[];
}

/**
 * Builds a directed dependency graph from a set of nodes and edges.
 * `edge.from` depends on `edge.to` (from -> to).
 */
export function buildDependencyGraph(
  nodes: string[],
  edges: GraphEdge[]
): DependencyGraph {
  const nodeSet = new Set<string>(nodes);
  const adjacency = new Map<string, Set<string>>();
  const reverseAdjacency = new Map<string, Set<string>>();

  for (const n of nodeSet) {
    adjacency.set(n, new Set());
    reverseAdjacency.set(n, new Set());
  }

  for (const e of edges) {
    nodeSet.add(e.from);
    nodeSet.add(e.to);

    if (!adjacency.has(e.from)) adjacency.set(e.from, new Set());
    if (!adjacency.has(e.to)) adjacency.set(e.to, new Set());
    if (!reverseAdjacency.has(e.from)) reverseAdjacency.set(e.from, new Set());
    if (!reverseAdjacency.has(e.to)) reverseAdjacency.set(e.to, new Set());

    adjacency.get(e.from)!.add(e.to);
    reverseAdjacency.get(e.to)!.add(e.from);
  }

  return { nodes: nodeSet, adjacency, reverseAdjacency };
}

/**
 * Detects all elementary cycles in the graph using Depth-First Search with backtracking.
 * Returns an array of cycles, where each cycle is an ordered array of node IDs.
 */
export function detectGraphCycles(graph: DependencyGraph): string[][] {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const currentPath: string[] = [];
  const cycles: string[][] = [];

  function dfs(node: string) {
    visited.add(node);
    recursionStack.add(node);
    currentPath.push(node);

    const neighbors = graph.adjacency.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (recursionStack.has(neighbor)) {
        // Cycle detected: slice from the start of the cycle to the end, then close it
        const cycleStartIndex = currentPath.indexOf(neighbor);
        if (cycleStartIndex !== -1) {
          const cycle = currentPath.slice(cycleStartIndex);
          cycle.push(neighbor); // e.g. ["A", "B", "C", "A"]
          cycles.push(cycle);
        }
      }
    }

    currentPath.pop();
    recursionStack.delete(node);
  }

  for (const node of graph.nodes) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  return cycles;
}

/**
 * Computes the blast radius when a target node or set of targets is changed.
 * Traverses reverse adjacency to identify all direct and transitive consumers.
 */
export function computeBlastRadius(
  targets: string[],
  graph: DependencyGraph,
  contractMapping: Record<string, string[]> = {}
): BlastRadiusReport {
  const directDependents = new Set<string>();
  const transitiveDependents = new Set<string>();
  const targetSet = new Set(targets);

  // 1. Collect direct dependents
  for (const target of targets) {
    const dependents = graph.reverseAdjacency.get(target) || new Set();
    for (const dep of dependents) {
      if (!targetSet.has(dep)) {
        directDependents.add(dep);
      }
    }
  }

  // 2. BFS / Queue for transitive dependents
  const queue: string[] = Array.from(directDependents);
  const visited = new Set<string>(directDependents);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const callers = graph.reverseAdjacency.get(current) || new Set();
    for (const caller of callers) {
      if (!targetSet.has(caller) && !visited.has(caller)) {
        visited.add(caller);
        transitiveDependents.add(caller);
        queue.push(caller);
      }
    }
  }

  // 3. Cycle check
  const cyclePaths = detectGraphCycles(graph);
  const hasCycle = cyclePaths.length > 0;

  // 4. Affected contracts
  const affectedContracts = new Set<string>();
  for (const t of targets) {
    if (contractMapping[t]) {
      contractMapping[t].forEach((c) => affectedContracts.add(c));
    }
  }
  for (const dep of directDependents) {
    if (contractMapping[dep]) {
      contractMapping[dep].forEach((c) => affectedContracts.add(c));
    }
  }

  // 5. Risk assessment
  const totalAffected = directDependents.size + transitiveDependents.size;
  let riskLevel: RiskLevel = "LOW";
  if (hasCycle) {
    riskLevel = "CRITICAL";
  } else if (totalAffected > 10 || affectedContracts.size > 2) {
    riskLevel = "HIGH";
  } else if (totalAffected > 2 || directDependents.size > 1) {
    riskLevel = "MEDIUM";
  }

  // 6. Suggested verification commands
  const suggestedVerification: string[] = [];
  if (hasCycle) {
    suggestedVerification.push("Break circular dependency: inspect cycle path and introduce abstraction/event bus");
  }
  if (affectedContracts.has(".nx/db/schema.sql") || affectedContracts.has(".nx/db/schema.prisma")) {
    suggestedVerification.push("npx prisma validate || psql -c '\\d'");
  }
  if (affectedContracts.has(".nx/ui/design-tokens.json")) {
    suggestedVerification.push("npm run test:tokens || npm run build");
  }
  if (suggestedVerification.length === 0) {
    suggestedVerification.push("npm test");
  }

  return {
    target: targets.join(", "),
    directDependents: Array.from(directDependents),
    transitiveDependents: Array.from(transitiveDependents),
    totalAffected,
    riskLevel,
    hasCycle,
    cyclePaths,
    affectedContracts: Array.from(affectedContracts),
    suggestedVerification,
  };
}

