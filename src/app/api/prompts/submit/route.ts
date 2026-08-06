import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in to submit prompts." }, { status: 401 });
    }

    const { title, description, category, body } = await req.json();

    if (!title || !description || !body) {
      return NextResponse.json({ error: "Title, description, and prompt body are required." }, { status: 400 });
    }

    const id = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const admin = createAdminClient();

    const { error } = await admin.from("prompt_templates").insert({
      id,
      title: title.trim(),
      description: description.trim(),
      category: category || "general",
      body: body.trim(),
      status: "pending",
      is_public: false,
      submitted_by: user.email || user.id,
      sort: 100,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Prompt submitted successfully! It is now pending admin review.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to submit prompt." },
      { status: 500 }
    );
  }
}
