"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  listingId: string;
  title?: string | null;
};

export function DeleteListingButton({ listingId, title }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const handleDelete = async () => {
    const label = title ? `"${title}"` : "this listing";
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
    setStatus("loading");
    const supabase = createClient();
    const { error } = await supabase.from("listings").delete().eq("id", listingId);
    if (error) {
      setStatus("error");
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={status === "loading"}
        className="text-xs font-semibold text-danger transition hover:text-danger/80 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Deleting..." : "Delete listing"}
      </button>
      {status === "error" ? (
        <p className="text-[11px] text-danger/80">
          Unable to delete. Please try again.
        </p>
      ) : null}
    </div>
  );
}
