"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { getPhase } from "@/lib/phases";
import { useWorkspace } from "@/lib/workspace-store";
import { IdeaPhase } from "@/components/phases/IdeaPhase";
import { TechStackPhase } from "@/components/phases/TechStackPhase";
import { BuildPhase } from "@/components/phases/BuildPhase";
import { CustomStagePhase } from "@/components/phases/CustomStagePhase";

export default function PhasePage() {
  const params = useParams<{ phaseId: string }>();
  const { customStages } = useWorkspace();
  const phase = getPhase(params.phaseId);
  const custom = customStages.find((s) => s.id === params.phaseId);

  if (!phase && !custom) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">Phase not found</h1>
        <Link href="/" className="mt-4 inline-block text-primary hover:underline">
          ← Back to Canvas
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      {params.phaseId === "idea" && <IdeaPhase />}
      {params.phaseId === "tech-stack" && <TechStackPhase />}
      {params.phaseId === "build" && <BuildPhase />}
      {custom && <CustomStagePhase stageId={custom.id} />}
    </div>
  );
}
