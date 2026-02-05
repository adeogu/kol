"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });
      if (authError) {
        setError(authError.message);
        return;
      }
      if (data.session) {
        router.push("/onboarding");
      } else {
        setStatus(
          "Check your email to confirm your account, then log in to continue.",
        );
        router.push("/login?message=confirm-email");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 rounded-3xl border border-ink/10 bg-white p-8 shadow-[0_20px_40px_rgba(17,18,15,0.12)]">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
          Create your account
        </p>
        <h1 className="section-title text-3xl font-semibold text-ink">
          Join HuntStay
        </h1>
        <p className="text-sm text-ink/60">
          Set up your profile and choose your role.
        </p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-ink">First name</label>
            <input
              className="field mt-2 w-full rounded-xl px-4 py-3 text-sm"
              type="text"
              required
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Sean"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">Last name</label>
            <input
              className="field mt-2 w-full rounded-xl px-4 py-3 text-sm"
              type="text"
              required
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="O'Connor"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">Email</label>
          <input
            className="field mt-2 w-full rounded-xl px-4 py-3 text-sm"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">Password</label>
          <input
            className="field mt-2 w-full rounded-xl px-4 py-3 text-sm"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 8 characters"
          />
        </div>
        {error ? (
          <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <button
          className="w-full rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-forest/30 transition hover:bg-pine disabled:cursor-not-allowed disabled:opacity-70"
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
      {status ? (
        <p className="rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          {status}
        </p>
      ) : null}
      <p className="text-sm text-ink/60">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-forest">
          Log in
        </Link>
      </p>
    </div>
  );
}
