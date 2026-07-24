import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUser } from "@/lib/github-server";

const COOKIE = "gh_token";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { token?: string };
  const token = body.token?.trim();
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const user = await getUser(token);
  if (!user) {
    return NextResponse.json({ error: "Invalid token." }, { status: 401 });
  }

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({
    connected: true,
    login: user.login,
    avatar: user.avatar_url,
    name: user.name,
  });
}
