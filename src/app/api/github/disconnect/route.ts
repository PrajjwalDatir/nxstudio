import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  (await cookies()).delete("gh_token");
  return NextResponse.json({ connected: false });
}
