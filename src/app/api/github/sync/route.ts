import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { syncRepo } from "@/lib/github-server";

export async function GET(req: NextRequest) {
  const token = (await cookies()).get("gh_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not connected to GitHub." }, { status: 401 });
  }

  const repo = req.nextUrl.searchParams.get("repo");
  const branch = req.nextUrl.searchParams.get("branch") || "main";
  if (!repo) {
    return NextResponse.json({ error: "Missing repo parameter." }, { status: 400 });
  }

  const result = await syncRepo(token, repo, branch);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}
