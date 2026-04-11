"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ensureConversation } from "@/lib/conversations";

type Props = {
  listingId: string;
  hunterId: string;
  landownerId: string;
  label: string;
  loadingLabel?: string;
  className?: string;
};

export function StartConversationButton({
  listingId,
  hunterId,
  landownerId,
  label,
  loadingLabel = "Opening...",
  className,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const openConversation = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { conversationId } = await ensureConversation(supabase, {
        listingId,
        hunterId,
        landownerId,
      });

      if (conversationId) {
        router.push(`/messages?conversation=${conversationId}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={openConversation}
      className={
        className ??
        "min-h-[42px] rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-forest hover:text-forest disabled:opacity-60 sm:text-xs"
      }
    >
      {loading ? loadingLabel : label}
    </button>
  );
}
