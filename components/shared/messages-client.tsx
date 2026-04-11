"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRealtime } from "@/hooks/use-realtime";
import { useOnlineStatus } from "@/hooks/use-online-status";
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

type ProfileLite = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

type ListingLite = {
  id: string;
  title: string | null;
};

export function MessagesClient() {
  const isOnline = useOnlineStatus();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, ProfileLite>>({});
  const [listingsById, setListingsById] = useState<Record<string, ListingLite>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const selectedId = useMemo(() => {
    return searchParams?.get("conversation") ?? activeId;
  }, [searchParams, activeId]);

  const conversationCards = useMemo(() => {
    return conversations.map((conversation) => {
      const otherParticipantId =
        conversation.hunter_id === userId
          ? conversation.landowner_id
          : conversation.hunter_id;
      const profile = profilesById[otherParticipantId];
      const otherName =
        [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
        profile?.email?.split("@")[0] ||
        "Conversation";
      const listingTitle = listingsById[conversation.listing_id]?.title ?? "Listing";

      return {
        conversation,
        otherName,
        listingTitle,
      };
    });
  }, [conversations, userId, profilesById, listingsById]);

  const markConversationRead = useCallback(
    async (conversationId: string, currentUserId: string) => {
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
    },
    [],
  );

  const loadMessages = useCallback(
    async (conversationId: string) => {
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
    },
    [markConversationRead, userId],
  );

  useRealtime({
    table: "messages",
    onChange: () => {
      if (selectedId) loadMessages(selectedId);
    },
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .or(`hunter_id.eq.${user.id},landowner_id.eq.${user.id}`);
      if (!active) return;
      const nextConversations = (data ?? []) as Conversation[];
      setConversations(nextConversations);
      setActiveId((prev) => prev ?? nextConversations[0]?.id ?? null);

      const participantIds = Array.from(
        new Set(
          nextConversations.map((conversation) =>
            conversation.hunter_id === user.id
              ? conversation.landowner_id
              : conversation.hunter_id,
          ),
        ),
      );
      const listingIds = Array.from(
        new Set(nextConversations.map((conversation) => conversation.listing_id)),
      );

      const [{ data: profilesData }, { data: listingsData }] = await Promise.all([
        participantIds.length > 0
          ? supabase
              .from("profiles")
              .select("id, first_name, last_name, email")
              .in("id", participantIds)
          : Promise.resolve({ data: [] as ProfileLite[] }),
        listingIds.length > 0
          ? supabase.from("listings").select("id, title").in("id", listingIds)
          : Promise.resolve({ data: [] as ListingLite[] }),
      ]);

      if (!active) return;
      const nextProfilesById = ((profilesData ?? []) as ProfileLite[]).reduce<
        Record<string, ProfileLite>
      >((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {});
      const nextListingsById = ((listingsData ?? []) as ListingLite[]).reduce<
        Record<string, ListingLite>
      >((acc, listing) => {
        acc[listing.id] = listing;
        return acc;
      }, {});

      setProfilesById(nextProfilesById);
      setListingsById(nextListingsById);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (selectedId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadMessages(selectedId);
    }
  }, [selectedId, loadMessages]);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, selectedId]);

  const sendMessage = async () => {
    if (!isOnline) return;
    if (!content.trim() || !selectedId || !userId) return;
    const text = content.trim();
    const response = await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: selectedId,
        content: text,
      }),
    });
    if (!response.ok) return;
    setContent("");
  };

  return (
    <div className="grid gap-6 md:grid-cols-[0.4fr_0.6fr]">
      <div className="rounded-3xl border border-ink/10 bg-white p-4">
        <p className="text-sm font-semibold text-ink">Conversations</p>
        <div className="mt-4 space-y-2">
          {conversationCards.map(({ conversation, otherName, listingTitle }) => (
            <button
              key={conversation.id}
              onClick={() => setActiveId(conversation.id)}
              className={`w-full rounded-2xl border px-4 py-3 text-left text-xs transition ${
                selectedId === conversation.id
                  ? "border-forest bg-forest/10 text-forest"
                  : "border-ink/10 text-ink/70 hover:border-forest/40"
              }`}
            >
              <p className="text-sm font-semibold leading-tight text-ink">{otherName}</p>
              <p className="mt-1 truncate text-xs text-ink/60">{listingTitle}</p>
            </button>
          ))}
          {conversations.length === 0 ? (
            <p className="text-xs text-ink/60">
              No conversations yet. Start one from a listing or booking.
            </p>
          ) : null}
        </div>
      </div>
      <div className="rounded-3xl border border-ink/10 bg-white p-4">
        <div className="flex h-[62dvh] min-h-[380px] flex-col md:h-[30rem]">
          <div ref={messagesRef} className="flex-1 overflow-auto">
            <MessageList messages={messages} currentUserId={userId ?? undefined} />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input
              className="field flex-1 rounded-full px-4 py-2 text-base md:text-sm"
              placeholder="Type a message"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              disabled={!isOnline}
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!isOnline}
              className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Send
            </button>
          </div>
          {!isOnline ? (
            <p className="mt-2 text-xs text-amber-900">
              You are offline. Messaging is read-only until you reconnect.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
