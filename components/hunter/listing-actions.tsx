"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ensureConversation } from "@/lib/conversations";

type Props = {
  listingId: string;
  landownerId: string;
};

export function ListingActions({ listingId, landownerId }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id === landownerId) {
        setIsOwner(true);
      }
    };
    loadUser();
  }, [landownerId]);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("favorites").upsert({
        user_id: user.id,
        listing_id: listingId,
      });
    }
    setSaving(false);
  };

  const handleMessage = async () => {
    setMessaging(true);
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
        hunterId: user.id,
        landownerId,
      });

      if (conversationId) {
        router.push(`/messages?conversation=${conversationId}`);
      }
    } finally {
      setMessaging(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || isOwner}
        className="min-h-[42px] rounded-full border border-ink/15 px-5 py-2 text-sm font-semibold text-ink/70 transition hover:border-forest hover:text-forest disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save listing"}
      </button>
      <button
        type="button"
        onClick={handleMessage}
        disabled={messaging || isOwner}
        className="min-h-[42px] rounded-full bg-forest px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-forest/30 transition hover:bg-pine disabled:opacity-60"
      >
        {messaging ? "Opening..." : "Message landowner"}
      </button>
    </div>
  );
}
