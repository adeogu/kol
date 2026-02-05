"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ANIMALS, COUNTIES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

export default function HunterOnboardingPage() {
  const router = useRouter();
  const [county, setCounty] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleAnimal = (animal: string) => {
    setSelectedAnimals((prev) =>
      prev.includes(animal)
        ? prev.filter((item) => item !== animal)
        : [...prev, animal],
    );
  };

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

      let licenseDocumentUrl: string | null = null;
      if (licenseFile) {
        const filePath = `${user.id}/${Date.now()}-${licenseFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("licenses")
          .upload(filePath, licenseFile, {
            cacheControl: "3600",
            upsert: true,
          });
        if (uploadError) {
          setError(uploadError.message);
          return;
        }
        const { data } = supabase.storage
          .from("licenses")
          .getPublicUrl(filePath);
        licenseDocumentUrl = data.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          county,
          license_number: licenseNumber,
          hunting_preferences: selectedAnimals,
          license_document_url: licenseDocumentUrl,
        })
        .eq("id", user.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 rounded-3xl border border-ink/10 bg-white p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
          Hunter onboarding
        </p>
        <h1 className="section-title text-3xl font-semibold text-ink">
          Set your hunting preferences
        </h1>
        <p className="text-sm text-ink/60">
          Share where you hunt, your preferred wildlife, and upload a license if
          available.
        </p>
      </div>
      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <form className="space-y-5" onSubmit={handleSubmit}>
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
            Preferred animals
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            {ANIMALS.map((animal) => (
              <button
                key={animal}
                type="button"
                onClick={() => toggleAnimal(animal)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  selectedAnimals.includes(animal)
                    ? "bg-forest text-white"
                    : "border border-ink/15 text-ink/70 hover:border-forest hover:text-forest"
                }`}
              >
                {animal}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">
            License number
          </label>
          <input
            className="field mt-2 w-full rounded-xl px-4 py-3 text-sm"
            value={licenseNumber}
            onChange={(event) => setLicenseNumber(event.target.value)}
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">
            Upload license (optional)
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            className="mt-2 w-full text-sm text-ink/70"
            onChange={(event) => setLicenseFile(event.target.files?.[0] ?? null)}
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
