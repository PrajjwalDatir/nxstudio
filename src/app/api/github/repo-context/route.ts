import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchRepoContextForImport } from "@/lib/github-server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const repo = req.nextUrl.searchParams.get("repo");
  const branch = req.nextUrl.searchParams.get("branch") || undefined;

  if (!repo || !repo.trim()) {
    return NextResponse.json({ error: "Missing required repo parameter." }, { status: 400 });
  }

  const token = (await cookies()).get("gh_token")?.value;
  const result = await fetchRepoContextForImport(token, repo.trim(), branch);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result);
}
