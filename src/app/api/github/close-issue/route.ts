import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { closeIssue } from "@/lib/github-server";

export async function POST(req: NextRequest) {
  const token = (await cookies()).get("gh_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not connected to GitHub." }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { repo?: string; issueNumber?: number };
  if (!body.repo || !body.issueNumber) {
    return NextResponse.json({ error: "Missing repo or issueNumber." }, { status: 400 });
  }

  const ok = await closeIssue(token, body.repo, body.issueNumber);
  if (!ok) {
    return NextResponse.json({ error: "Failed to close the issue." }, { status: 502 });
  }
  return NextResponse.json({ closed: true });
}
