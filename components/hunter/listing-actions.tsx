"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

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
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listingId)
      .eq("hunter_id", user.id)
      .maybeSingle();

    let conversationId = existing?.id;
    if (!conversationId) {
      const { data: created } = await supabase
        .from("conversations")
        .insert({
          listing_id: listingId,
          hunter_id: user.id,
          landowner_id: landownerId,
        })
        .select("id")
        .single();
      conversationId = created?.id;
    }

    if (conversationId) {
      router.push(`/messages?conversation=${conversationId}`);
    }
    setMessaging(false);
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || isOwner}
        className="rounded-full border border-ink/15 px-5 py-2 text-sm font-semibold text-ink/70 transition hover:border-forest hover:text-forest disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save listing"}
      </button>
      <button
        type="button"
        onClick={handleMessage}
        disabled={messaging || isOwner}
        className="rounded-full bg-forest px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-forest/30 transition hover:bg-pine disabled:opacity-60"
      >
        {messaging ? "Opening..." : "Message landowner"}
      </button>
    </div>
  );
}
