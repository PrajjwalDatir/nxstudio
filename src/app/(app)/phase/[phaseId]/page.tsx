"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { getPhase } from "@/lib/phases";
import { IdeaPhase } from "@/components/phases/IdeaPhase";
import { ValidationPhase } from "@/components/phases/ValidationPhase";
import { PrototypePhase } from "@/components/phases/PrototypePhase";
import { TechStackPhase } from "@/components/phases/TechStackPhase";
import { BuildPhase } from "@/components/phases/BuildPhase";
import { LaunchPhase } from "@/components/phases/LaunchPhase";

export default function PhasePage() {
  const params = useParams<{ phaseId: string }>();
  const phase = getPhase(params.phaseId);

  if (!phase) {
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
      {params.phaseId === "validation" && <ValidationPhase />}
      {params.phaseId === "prototype" && <PrototypePhase />}
      {params.phaseId === "tech-stack" && <TechStackPhase />}
      {params.phaseId === "build" && <BuildPhase />}
      {params.phaseId === "launch" && <LaunchPhase />}
    </div>
  );
}
