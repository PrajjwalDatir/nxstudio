"use client";

/**
 * The unified Studio: one toolcraft tool driving one shared canvas.
 *
 * The schema is chosen from the subscription — Pro users get localStorage
 * persistence (work survives reloads), free users get a session-only schema.
 * Panel actions route Brand → attach-to-build-context and Generative →
 * randomize seed. The floating mode toolbar and canvas actions live inside
 * StudioCanvas (canvasContent).
 */
import { useCallback, useMemo, useRef } from "react";
import { Toaster, toast } from "sonner";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { ToolcraftApp } from "@/toolcraft/runtime/react";
import type { ToolcraftPanelActionContext } from "@/toolcraft/runtime/react";
import { useWorkspace } from "@/lib/workspace-store";
import { useSubscription } from "@/lib/use-subscription";
import type { BrandDNA } from "@/lib/types";
import { studioSchema, studioSchemaFree, ATTACH_ACTION, GEN_RANDOMIZE, GEN_TARGETS } from "@/lib/studio/schema";
import { brandPatchFromStudioValues } from "@/lib/studio/studio-context";
import { StudioCanvas } from "./StudioCanvas";

import { readAnnotationNotes } from "./tools/AnnotationLayer";

export function UnifiedStudio() {
  const { updateBrand, updateDesignNotes } = useWorkspace();
  const { isActive } = useSubscription();
  const annotationApiRef = useRef<ExcalidrawImperativeAPI | null>(null);

  const onPanelAction = useCallback(
    ({ action, state, dispatch }: ToolcraftPanelActionContext) => {
      if (action.value === ATTACH_ACTION) {
        const patch = brandPatchFromStudioValues(state.values);
        const fields = Object.keys(patch) as (keyof BrandDNA)[];
        const notes = readAnnotationNotes(annotationApiRef.current);

        if (fields.length === 0 && !notes) {
          toast.message("Nothing to attach yet", { description: "Set a colour or vibe, or sketch a note first." });
          return;
        }
        for (const field of fields) {
          const value = patch[field];
          if (value !== undefined) updateBrand(field, value);
        }
        updateDesignNotes(notes);

        const parts: string[] = [];
        if (fields.length) parts.push(`${fields.length} brand field${fields.length === 1 ? "" : "s"}`);
        if (notes) parts.push("your sketched notes");
        toast.success("Attached to build context", {
          description: `Your build prompts now reflect ${parts.join(" and ")}.`,
        });
        return;
      }
      if (action.value === GEN_RANDOMIZE) {
        dispatch({ type: "controls.setValue", target: GEN_TARGETS.seed, value: Math.floor(Math.random() * 100000) });
      }
    },
    [updateBrand, updateDesignNotes]
  );

  const handleAnnotationApi = useCallback((api: ExcalidrawImperativeAPI) => {
    annotationApiRef.current = api;
  }, []);

  const canvasContent = useMemo(
    () => <StudioCanvas onAnnotationApi={handleAnnotationApi} />,
    [handleAnnotationApi]
  );



  return (
    <>
      <ToolcraftApp
        className="h-full min-h-full"
        schema={isActive ? studioSchema : studioSchemaFree}
        onPanelAction={onPanelAction}
        canvasContent={canvasContent}
      />
      <Toaster theme="dark" position="bottom-right" richColors />
    </>
  );
}
