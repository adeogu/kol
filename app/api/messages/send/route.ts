import { NextResponse } from "next/server";
import { z } from "zod";
import { sendPushToUser } from "@/lib/push/server";
import { createRouteSupabase } from "@/lib/supabase/server";

const payloadSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().trim().min(1).max(3000),
});

export async function POST(request: Request) {
  const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message payload." }, { status: 400 });
  }

  const supabase = await createRouteSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id,hunter_id,landowner_id")
    .eq("id", parsed.data.conversationId)
    .single();

  if (conversationError || !conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const isParticipant =
    conversation.hunter_id === user.id || conversation.landowner_id === user.id;
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { error: insertError } = await supabase.from("messages").insert({
    conversation_id: parsed.data.conversationId,
    sender_id: user.id,
    content: parsed.data.content,
  });

  if (insertError) {
    return NextResponse.json({ error: "Unable to send message." }, { status: 500 });
  }

  const recipientId =
    conversation.hunter_id === user.id
      ? conversation.landowner_id
      : conversation.hunter_id;
  await sendPushToUser(recipientId, {
    title: "New HuntStay message",
    body: parsed.data.content.slice(0, 120),
    url: `/messages?conversation=${conversation.id}`,
    tag: `message-${conversation.id}`,
  });

  return NextResponse.json({ ok: true });
}
