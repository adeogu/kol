"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRealtime } from "@/hooks/use-realtime";
import { MessageList } from "@/components/shared/message-list";

type Conversation = {
  id: string;
  listing_id: string;
  hunter_id: string;
  landowner_id: string;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export function MessagesClient() {
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const selectedId = useMemo(() => {
    return searchParams.get("conversation") ?? activeId;
  }, [searchParams, activeId]);

  const loadConversations = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .or(`hunter_id.eq.${user.id},landowner_id.eq.${user.id}`);
    setConversations((data ?? []) as Conversation[]);
    if (!activeId && data && data.length > 0) {
      setActiveId(data[0].id);
    }
  };

  const loadMessages = useCallback(async (conversationId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as Message[]);
    if (userId) {
      await markConversationRead(conversationId, userId);
      window.dispatchEvent(new CustomEvent("huntstay:messages-read"));
    }
  }, [userId]);

  const markConversationRead = async (
    conversationId: string,
    currentUserId: string,
  ) => {
    const supabase = createClient();
    await supabase
      .from("messages")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("conversation_id", conversationId)
      .neq("sender_id", currentUserId)
      .eq("is_read", false);
  };

  useRealtime({
    table: "messages",
    onChange: () => {
      if (selectedId) loadMessages(selectedId);
    },
  });

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadMessages(selectedId);
    }
  }, [selectedId, loadMessages]);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, selectedId]);

  const sendMessage = async () => {
    if (!content.trim() || !selectedId || !userId) return;
    const supabase = createClient();
    await supabase.from("messages").insert({
      conversation_id: selectedId,
      sender_id: userId,
      content: content.trim(),
    });
    setContent("");
  };

  return (
    <div className="grid gap-6 md:grid-cols-[0.4fr_0.6fr]">
      <div className="rounded-3xl border border-ink/10 bg-white p-4">
        <p className="text-sm font-semibold text-ink">Conversations</p>
        <div className="mt-4 space-y-2">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveId(conv.id)}
              className={`w-full rounded-2xl border px-4 py-3 text-left text-xs transition ${
                selectedId === conv.id
                  ? "border-forest bg-forest/10 text-forest"
                  : "border-ink/10 text-ink/70 hover:border-forest/40"
              }`}
            >
              Conversation {conv.id.slice(0, 6)}
            </button>
          ))}
          {conversations.length === 0 ? (
            <p className="text-xs text-ink/60">
              No conversations yet. Message a landowner from a listing.
            </p>
          ) : null}
        </div>
      </div>
      <div className="rounded-3xl border border-ink/10 bg-white p-4">
        <div className="flex h-80 flex-col">
          <div ref={messagesRef} className="flex-1 overflow-auto">
            <MessageList messages={messages} currentUserId={userId ?? undefined} />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input
              className="field flex-1 rounded-full px-4 py-2 text-sm"
              placeholder="Type a message"
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
            <button
              type="button"
              onClick={sendMessage}
              className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
