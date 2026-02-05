"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRealtime } from "@/hooks/use-realtime";

export function InboxBadge() {
  const [count, setCount] = useState(0);

  const loadCount = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCount(0);
      return;
    }

    const { data: conversations } = await supabase
      .from("conversations")
      .select("id")
      .or(`hunter_id.eq.${user.id},landowner_id.eq.${user.id}`);

    const ids = conversations?.map((item) => item.id) ?? [];
    if (ids.length === 0) {
      setCount(0);
      return;
    }

    const { count: unreadCount } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", ids)
      .eq("is_read", false)
      .neq("sender_id", user.id);

    setCount(unreadCount ?? 0);
  }, []);

  useRealtime({
    table: "messages",
    onChange: () => {
      loadCount();
    },
  });

  useEffect(() => {
    loadCount();
  }, [loadCount]);

  useEffect(() => {
    const handleRead = () => {
      loadCount();
    };
    window.addEventListener("huntstay:messages-read", handleRead);
    return () => {
      window.removeEventListener("huntstay:messages-read", handleRead);
    };
  }, [loadCount]);

  if (count === 0) return null;

  return (
    <span className="flex min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-[18px] text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
