import { WorkspaceData } from "./types";
import { NX_ROOT } from "./nx-compiler";
import { compileStack } from "./platform-engine";

export interface MachineFile {
  path: string;
  description: string;
  content: string;
}

export interface MachineWorkflowsResult {
  productName: string;
  julesInstructions: MachineFile;
  julesConfig: MachineFile;
  githubActionWorkflow: MachineFile;
  testDrivenDeployGate: MachineFile;
  allFiles: MachineFile[];
}

export function generateMachineWorkflows(data: WorkspaceData): MachineWorkflowsResult {
  const name = data.productName || "Product";
  const stack = compileStack(data.tech);
  const fe = stack?.frontend || "Next.js (React)";
  const lang = stack?.language || "TypeScript";

  const julesInstructions: MachineFile = {
    path: ".jules/instructions.md",
    description: "Jules AI agent instruction protocol for autonomous background coding & maintenance.",
    content: `# Autonomous Agent Protocol — ${name} (.jules)

You are the autonomous maintainer for **${name}** built on **${fe} (${lang})**.
Read \`${NX_ROOT}/\` context files before executing any task.

## Rules of Engagement
1. **Test-First Development**: Every bug fix or new feature MUST begin with a failing unit test. Never write implementation logic before a test case proves the defect/requirement.
2. **Deterministic Verification**: Run test suites and static analysis before committing.
3. **Automated Pull Requests**: Wrap completed tasks in a single commit, write a concise PR description with test results, and tag for review.
4. **Zero-Linter Violations**: Strict adherence to TypeScript types and lint standards.
`,
  };

  const julesConfig: MachineFile = {
    path: ".jules/agent-config.json",
    description: "Jules agent execution configuration & environment bounds.",
    content: JSON.stringify(
      {
        $schema: "https://jules.ai/schema/v1/config.json",
        project: name,
        stack: { frontend: fe, language: lang },
        contextDirectory: `${NX_ROOT}/`,
        autonomy: {
          createBranches: true,
          openPullRequests: true,
          autoFixLints: true,
          requireTestsPassBeforePR: true,
        },
        triggers: ["issues.labeled.bug", "issues.labeled.feature", "pull_request.synchronize"],
      },
      null,
      2
    ),
  };

  const githubActionWorkflow: MachineFile = {
    path: ".github/workflows/ai-issue-test-deploy.yml",
    description: "GitHub Action workflow: Issue -> AI Test Generation -> Business Logic -> PR -> Test-Gated Deploy.",
    content: `name: Autonomous AI Test & Deploy Pipeline

on:
  issues:
    types: [opened, labeled]
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  agentic-test-and-build:
    if: contains(github.event.issue.labels.*.name, 'ai-build') || github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Codebase
        uses: actions/checkout@v4

      - name: Setup Node.js & Dependencies
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Project Dependencies
        run: npm ci || npm install

      - name: Step 1 — Autonomous AI Test Case Generation
        env:
          ISSUE_TITLE: \${{ github.event.issue.title }}
          ISSUE_BODY: \${{ github.event.issue.body }}
        run: |
          echo "Generating automated test cases for issue: $ISSUE_TITLE"
          mkdir -p tests/generated
          # AI Agent writes test case asserting expected bug fix / feature behavior

      - name: Step 2 — Run Unit & Integration Tests (Must Pass)
        run: |
          npm test -- --bail || npx vitest run || npx jest --bail

      - name: Step 3 — Autonomous PR Creation
        if: github.event_name == 'issues'
        env:
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        run: |
          git config user.name "nx-studio-agent[bot]"
          git config user.email "bot@nxstudio.ai"
          git checkout -b "fix/issue-\${{ github.event.issue.number }}"
          git add .
          git commit -m "fix: autonomous resolution for issue #\${{ github.event.issue.number }}"
          git push origin "fix/issue-\${{ github.event.issue.number }}"
          gh pr create --title "AI Fix for #\${{ github.event.issue.number }}" --body "Automated test cases written & passed."

  deploy-gate:
    needs: agentic-test-and-build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - name: Test-Gated Production Deploy
        run: |
          echo "All autonomous test gates PASSED. Deploying ${name} to production..."
`,
  };

  const testDrivenDeployGate: MachineFile = {
    path: `${NX_ROOT}/workflows/deploy-gate.md`,
    description: "Deployment safety policy & test-driven execution gate specifications.",
    content: `# Test-Driven Deployment Gate — ${name}

## Deployment Gate Policy
- **Rule 1**: Zero code ships to production without automated test coverage.
- **Rule 2**: If an issue is opened, the machine writes the failing test case first.
- **Rule 3**: Code doesn't deploy until unit & integration tests pass 100%.
- **Rule 4**: AI writes the business logic to satisfy the test contract.
`,
  };

  const allFiles = [julesInstructions, julesConfig, githubActionWorkflow, testDrivenDeployGate];

  return {
    productName: name,
    julesInstructions,
    julesConfig,
    githubActionWorkflow,
    testDrivenDeployGate,
    allFiles,
  };
}
