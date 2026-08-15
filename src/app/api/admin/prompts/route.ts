import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function checkIsAdmin() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Security Fix: Do not trust user_metadata for authorization as it can be modified client-side.
    if (user.app_metadata?.role === "admin") {
      return true;
    }

    const admin = createAdminClient();
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    return roleRow?.role === "admin";
  } catch {
    return false;
  }
}

export async function GET() {
  const isAdmin = await checkIsAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden. Admin role required." }, { status: 403 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("prompt_templates")
      .select("*")
      .order("sort", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ templates: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load templates." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const isAdmin = await checkIsAdmin();

  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden. Admin role required." }, { status: 403 });
  }

  try {
    const { id, status } = await req.json();
    if (!id || !["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("prompt_templates")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update status." },
      { status: 500 }
    );
  }
}
