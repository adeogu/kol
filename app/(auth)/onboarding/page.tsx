"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RoleSelectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (role: "HUNTER" | "LANDOWNER") => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        setError(
          "Please log in to continue. If you just signed up, confirm your email first.",
        );
        return;
      }
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", user.id);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      router.push(`/onboarding/${role === "HUNTER" ? "hunter" : "landowner"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 rounded-3xl border border-ink/10 bg-white p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
          Choose your role
        </p>
        <h1 className="section-title text-3xl font-semibold text-ink">
          Are you hunting or hosting?
        </h1>
        <p className="text-sm text-ink/60">
          This helps us tailor your dashboard, booking tools, and onboarding.
        </p>
      </div>
      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="grid gap-6 md:grid-cols-2">
        <button
          onClick={() => handleSelect("HUNTER")}
          disabled={loading}
          className="group flex h-full flex-col rounded-3xl border border-ink/10 bg-mist p-6 text-left transition hover:border-forest/40 hover:bg-white"
        >
          <p className="text-sm font-semibold text-forest">I am a hunter</p>
          <p className="mt-2 text-sm text-ink/70">
            Discover private land, book hunting access, and manage your trips.
          </p>
          <span className="mt-6 text-sm font-semibold text-forest group-hover:text-pine">
            Continue as hunter
          </span>
        </button>
        <button
          onClick={() => handleSelect("LANDOWNER")}
          disabled={loading}
          className="group flex h-full flex-col rounded-3xl border border-ink/10 bg-mist p-6 text-left transition hover:border-forest/40 hover:bg-white"
        >
          <p className="text-sm font-semibold text-forest">I own land</p>
          <p className="mt-2 text-sm text-ink/70">
            List your property, set availability, and earn from verified hunters.
          </p>
          <span className="mt-6 text-sm font-semibold text-forest group-hover:text-pine">
            Continue as landowner
          </span>
        </button>
      </div>
    </div>
  );
}
