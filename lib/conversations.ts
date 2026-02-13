import type { SupabaseClient } from "@supabase/supabase-js";

type EnsureConversationInput = {
  listingId: string;
  hunterId: string;
  landownerId: string;
};

type EnsureConversationResult = {
  conversationId: string | null;
  error: string | null;
};

export async function ensureConversation(
  supabase: SupabaseClient,
  { listingId, hunterId, landownerId }: EnsureConversationInput,
): Promise<EnsureConversationResult> {
  const { data: existing, error: existingError } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("hunter_id", hunterId)
    .maybeSingle();

  if (existingError) {
    return { conversationId: null, error: existingError.message };
  }

  if (existing?.id) {
    return { conversationId: existing.id, error: null };
  }

  const { data: created, error: createError } = await supabase
    .from("conversations")
    .insert({
      listing_id: listingId,
      hunter_id: hunterId,
      landowner_id: landownerId,
    })
    .select("id")
    .single();

  if (!createError && created?.id) {
    return { conversationId: created.id, error: null };
  }

  const { data: afterConflict, error: afterConflictError } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("hunter_id", hunterId)
    .maybeSingle();

  if (afterConflictError) {
    return {
      conversationId: null,
      error: createError?.message ?? afterConflictError.message,
    };
  }

  return {
    conversationId: afterConflict?.id ?? null,
    error:
      afterConflict?.id ? null : (createError?.message ?? "Unable to open conversation."),
  };
}
