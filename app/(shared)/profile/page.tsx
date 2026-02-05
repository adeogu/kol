"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone, role")
        .eq("id", user.id)
        .single();
      setFirstName(data?.first_name ?? "");
      setLastName(data?.last_name ?? "");
      setPhone(data?.phone ?? "");
      setRole(data?.role ?? "");
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ first_name: firstName, last_name: lastName, phone })
      .eq("id", user.id);
    setStatus("Profile updated.");
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      window.location.href = "/auth/signout";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
          Profile
        </p>
        <h1 className="section-title text-3xl font-semibold text-ink">
          Account settings
        </h1>
      </div>
      <div className="space-y-4 rounded-3xl border border-ink/10 bg-white p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-ink">First name</label>
            <input
              className="field mt-2 w-full rounded-xl px-4 py-3 text-sm"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">Last name</label>
            <input
              className="field mt-2 w-full rounded-xl px-4 py-3 text-sm"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">Phone</label>
          <input
            className="field mt-2 w-full rounded-xl px-4 py-3 text-sm"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">Role</label>
          <div className="mt-2 inline-flex rounded-full border border-ink/15 bg-forest/10 px-4 py-2 text-sm font-semibold text-forest">
            {role ? role.toLowerCase() : "Not set"}
          </div>
        </div>
        {status ? (
          <p className="rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
            {status}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="rounded-full bg-forest px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-ink/15 px-5 py-2 text-sm font-semibold text-ink/70"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
