import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export type AuthenticatedApiHandler<T = unknown> = (
  req: Request,
  user: User,
  body: T
) => Promise<NextResponse | Response>;

/**
  Higher-Order API Handler that enforces Supabase auth, parses JSON safely,
  and standardizes error responses across all API endpoints.
 */
export function withAuthApiHandler<T = unknown>(handler: AuthenticatedApiHandler<T>) {
  return async function (req: Request): Promise<NextResponse | Response> {
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      let body: T = {} as T;
      if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
        try {
          body = await req.json();
        } catch {
          body = {} as T;
        }
      }

      return await handler(req, user, body);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal Server Error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}
