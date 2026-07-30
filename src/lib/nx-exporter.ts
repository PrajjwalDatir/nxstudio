import JSZip from "jszip";
import { compileNxFiles } from "./nx-compiler";
import { WorkspaceData } from "./types";

/**
 * Generates a branded .nx/ context ZIP archive and triggers a native browser download.
 * Drops the entire .nx/ directory into the founder's repository root so AI agents
 * find pre-populated architecture files without burning tool turns.
 */
export async function exportNxZip(data: WorkspaceData): Promise<void> {
  const zip = new JSZip();
  const files = compileNxFiles(data);
  const productName = (data.productName || "product").toLowerCase().replace(/[^a-z0-9]+/g, "-");

  files.forEach((file) => {
    zip.file(file.path, file.content);
  });

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${productName}-nx-context.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
