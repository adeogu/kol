import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteSupabase } from "@/lib/supabase/server";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = subscriptionSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid push subscription payload." }, { status: 400 });
  }

  const supabase = await createRouteSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: parsed.data.endpoint,
      p256dh_key: parsed.data.keys.p256dh,
      auth_key: parsed.data.keys.auth,
      user_agent: request.headers.get("user-agent"),
      revoked_at: null,
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    return NextResponse.json(
      { error: "Unable to save push subscription." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const endpoint = new URL(request.url).searchParams.get("endpoint");
  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint." }, { status: 400 });
  }

  const supabase = await createRouteSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (error) {
    return NextResponse.json(
      { error: "Unable to revoke push subscription." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
