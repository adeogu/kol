"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      const supabase = createClient();

      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const queryErrorCode =
        searchParams.get("error_code") ?? hashParams.get("error_code");
      if (queryErrorCode === "otp_expired") {
        setError("This reset link has expired. Request a new password reset email.");
        return;
      }

      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const flowType = searchParams.get("type");

      if (code) {
        const { error: codeError } = await supabase.auth.exchangeCodeForSession(code);
        if (codeError) {
          setError("Reset link is invalid or expired. Request a new one.");
          return;
        }
      } else if (tokenHash && flowType === "recovery") {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash: tokenHash,
        });
        if (verifyError) {
          setError("Reset link is invalid or expired. Request a new one.");
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Reset link is invalid or expired. Request a new one.");
        return;
      }

      setSessionReady(true);
    };

    bootstrap();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!sessionReady) {
      setError("Open the reset link from your email first.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login?message=password-reset");
      }, 900);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 rounded-3xl border border-ink/10 bg-white p-8 shadow-[0_20px_40px_rgba(17,18,15,0.12)]">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
          Secure reset
        </p>
        <h1 className="section-title text-3xl font-semibold text-ink">
          Set a new password
        </h1>
        <p className="text-sm text-ink/60">
          Choose a new password for your HuntStay account.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          Password updated. Redirecting to login...
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-semibold text-ink">New password</label>
          <input
            className="field mt-2 w-full rounded-xl px-4 py-3 text-sm"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">
            Confirm password
          </label>
          <input
            className="field mt-2 w-full rounded-xl px-4 py-3 text-sm"
            type="password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter your password"
          />
        </div>
        <button
          className="w-full rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-forest/30 transition hover:bg-pine disabled:cursor-not-allowed disabled:opacity-70"
          type="submit"
          disabled={loading || success || !sessionReady}
        >
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>

      <p className="text-sm text-ink/60">
        Need a new link?{" "}
        <Link href="/forgot-password" className="font-semibold text-forest">
          Request again
        </Link>
      </p>
      <p className="text-sm text-ink/60">
        Back to{" "}
        <Link href="/login" className="font-semibold text-forest">
          login
        </Link>
      </p>
    </div>
  );
}
