import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUser } from "@/lib/github-server";

export async function GET() {
  const token = (await cookies()).get("gh_token")?.value;
  if (!token) return NextResponse.json({ connected: false });

  const user = await getUser(token);
  if (!user) return NextResponse.json({ connected: false });

  return NextResponse.json({
    connected: true,
    login: user.login,
    avatar: user.avatar_url,
    name: user.name,
  });
}
