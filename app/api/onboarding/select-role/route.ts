import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createRouteSupabase } from "@/lib/supabase/server";

type Role = "HUNTER" | "LANDOWNER";

function isRole(value: unknown): value is Role {
  return value === "HUNTER" || value === "LANDOWNER";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!isRole(body?.role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    const supabase = await createRouteSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || !user.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const admin = createAdminSupabase();
    const { error } = await admin.from("profiles").upsert(
      {
        id: user.id,
        email: user.email,
        role: body.role,
        onboarding_completed: true,
      },
      { onConflict: "id" },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not complete onboarding." },
      { status: 500 },
    );
  }
}
