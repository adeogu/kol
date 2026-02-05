"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { COUNTIES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

export default function LandownerOnboardingPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [county, setCounty] = useState("");
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Please log in to continue.");
        return;
      }

      let identityDocumentUrl: string | null = null;
      if (identityFile) {
        const filePath = `${user.id}/${Date.now()}-${identityFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("verifications")
          .upload(filePath, identityFile, {
            cacheControl: "3600",
            upsert: true,
          });
        if (uploadError) {
          setError(uploadError.message);
          return;
        }
        const { data } = supabase.storage
          .from("verifications")
          .getPublicUrl(filePath);
        identityDocumentUrl = data.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          phone,
          county,
          identity_document_url: identityDocumentUrl,
        })
        .eq("id", user.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.push("/properties");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 rounded-3xl border border-ink/10 bg-white p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
          Landowner onboarding
        </p>
        <h1 className="section-title text-3xl font-semibold text-ink">
          Verify your identity
        </h1>
        <p className="text-sm text-ink/60">
          This keeps the community trusted and prepares your account for
          payouts.
        </p>
      </div>
      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-semibold text-ink">Phone</label>
          <input
            className="field mt-2 w-full rounded-xl px-4 py-3 text-sm"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+353 87 123 4567"
            required
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">County</label>
          <select
            className="field mt-2 w-full rounded-xl px-4 py-3 text-sm"
            value={county}
            onChange={(event) => setCounty(event.target.value)}
            required
          >
            <option value="">Select a county</option>
            {COUNTIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">
            Upload identity document
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            className="mt-2 w-full text-sm text-ink/70"
            onChange={(event) =>
              setIdentityFile(event.target.files?.[0] ?? null)
            }
          />
        </div>
        <button
          className="w-full rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-forest/30 transition hover:bg-pine disabled:cursor-not-allowed disabled:opacity-70"
          type="submit"
          disabled={loading}
        >
          {loading ? "Saving..." : "Finish onboarding"}
        </button>
      </form>
    </div>
  );
}
