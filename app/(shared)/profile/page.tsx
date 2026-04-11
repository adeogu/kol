"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { PushNotificationsCard } from "@/components/shared/push-notifications-card";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const isOnline = useOnlineStatus();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseStatus, setLicenseStatus] = useState<string>("UNVERIFIED");
  const [licenseExpiryDate, setLicenseExpiryDate] = useState<string | null>(null);
  const [licenseVerifiedAt, setLicenseVerifiedAt] = useState<string | null>(null);
  const [licenseDocumentUrl, setLicenseDocumentUrl] = useState<string | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<string | null>(null);
  const isHunter = role === "HUNTER";
  const allowDemoBypass =
    process.env.NEXT_PUBLIC_DEV_ALLOW_LICENSE_BYPASS === "true" ||
    (process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_DEV_ALLOW_LICENSE_BYPASS !== "false");

  const licenseBadgeClasses = useMemo(() => {
    if (licenseStatus === "VERIFIED") {
      return "border-success/30 bg-success/10 text-success";
    }
    if (licenseStatus === "PENDING" || licenseStatus === "NEEDS_REVIEW") {
      return "border-amber-300/50 bg-amber-100/70 text-amber-900";
    }
    if (licenseStatus === "REJECTED") {
      return "border-danger/30 bg-danger/10 text-danger";
    }
    return "border-ink/15 bg-ink/5 text-ink/70";
  }, [licenseStatus]);

  const loadProfile = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select(
        "first_name, last_name, phone, role, license_number, license_status, license_expiry_date, license_verified_at, license_document_url",
      )
      .eq("id", user.id)
      .single();
    setFirstName(data?.first_name ?? "");
    setLastName(data?.last_name ?? "");
    setPhone(data?.phone ?? "");
    setRole(data?.role ?? "");
    setLicenseNumber(data?.license_number ?? "");
    setLicenseStatus(data?.license_status ?? "UNVERIFIED");
    setLicenseExpiryDate(data?.license_expiry_date ?? null);
    setLicenseVerifiedAt(data?.license_verified_at ?? null);
    setLicenseDocumentUrl(data?.license_document_url ?? null);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    setLoading(true);
    setStatus(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStatus("Please log in to update your profile.");
      setLoading(false);
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ first_name: firstName, last_name: lastName, phone })
      .eq("id", user.id);
    if (error) {
      setStatus(error.message);
      setLoading(false);
      return;
    }
    setStatus("Profile updated.");
    setLoading(false);
  };

  const submitLicenseVerification = async (useDemoBypass: boolean) => {
    if (!isHunter) return;
    if (!isOnline) {
      setVerifyStatus("Reconnect to the internet to verify your license.");
      return;
    }

    setVerifyLoading(true);
    setVerifyStatus(null);
    const supabase = createClient();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setVerifyStatus("Please log in to verify your license.");
        return;
      }

      let documentUrl = licenseDocumentUrl;
      if (licenseFile) {
        const filePath = `${user.id}/${Date.now()}-${licenseFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("licenses")
          .upload(filePath, licenseFile, {
            cacheControl: "3600",
            upsert: true,
          });
        if (uploadError) {
          setVerifyStatus(uploadError.message);
          return;
        }
        const { data } = supabase.storage.from("licenses").getPublicUrl(filePath);
        documentUrl = data.publicUrl;
      }

      if (!documentUrl && !useDemoBypass) {
        setVerifyStatus("Upload your hunting license image/PDF first.");
        return;
      }

      const { error: pendingError } = await supabase
        .from("profiles")
        .update({
          license_number: licenseNumber.trim() || null,
          license_document_url: documentUrl ?? null,
          license_status: "PENDING",
          license_verified: false,
        })
        .eq("id", user.id);

      if (pendingError) {
        setVerifyStatus(pendingError.message);
        return;
      }

      const response = await fetch("/api/license/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hunterId: user.id,
          licenseDocumentUrl: documentUrl ?? null,
          declaredLicenseNumber: licenseNumber.trim() || null,
          county: null,
          useDemoBypass,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setVerifyStatus(payload?.error ?? "Unable to verify license right now.");
        await loadProfile();
        return;
      }

      const payload = (await response.json().catch(() => null)) as {
        status?: string;
      } | null;
      const resolvedStatus = payload?.status ?? "PENDING";
      setVerifyStatus(`License verification updated: ${resolvedStatus}.`);
      setLicenseFile(null);
      setLicenseDocumentUrl(documentUrl ?? null);
      await loadProfile();
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleVerifyLicense = () => {
    void submitLicenseVerification(false);
  };

  const handleDemoBypassVerification = () => {
    void submitLicenseVerification(true);
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

      {isHunter ? (
        <div className="space-y-4 rounded-3xl border border-ink/10 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
                License verification
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-ink">
                  Verify before booking
                </h2>
                {allowDemoBypass ? (
                  <span className="rounded-full border border-amber-300/60 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-900">
                    Dev mode
                  </span>
                ) : null}
              </div>
            </div>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${licenseBadgeClasses}`}
            >
              {licenseStatus}
            </span>
          </div>

          <p className="text-sm text-ink/60">
            Hunters need a verified license before booking requests can be
            created.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-ink">
                License number
              </label>
              <input
                className="field mt-2 w-full rounded-xl px-4 py-3 text-sm"
                value={licenseNumber}
                onChange={(event) => setLicenseNumber(event.target.value)}
                placeholder="e.g. NARGC-12345"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-ink">
                Upload / replace license
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                className="mt-2 w-full text-sm text-ink/70"
                onChange={(event) =>
                  setLicenseFile(event.target.files?.[0] ?? null)
                }
              />
            </div>
          </div>

          {licenseExpiryDate ? (
            <p className="text-xs text-ink/60">Expiry date: {licenseExpiryDate}</p>
          ) : null}
          {licenseVerifiedAt ? (
            <p className="text-xs text-ink/60">
              Last verified: {new Date(licenseVerifiedAt).toLocaleString()}
            </p>
          ) : null}
          {licenseDocumentUrl ? (
            <p className="text-xs text-ink/60">
              Document on file.{" "}
              <Link
                href={licenseDocumentUrl}
                target="_blank"
                className="font-semibold text-forest"
              >
                View uploaded copy
              </Link>
            </p>
          ) : null}

          {!isOnline ? (
            <p className="rounded-xl border border-amber-300/40 bg-amber-100/70 px-3 py-2 text-xs text-amber-900">
              Offline mode: reconnect to submit verification.
            </p>
          ) : null}

          {verifyStatus ? (
            <p className="rounded-xl border border-ink/15 bg-ink/5 px-3 py-2 text-sm text-ink/70">
              {verifyStatus}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleVerifyLicense}
            disabled={verifyLoading || !isOnline}
            className="rounded-full bg-forest px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {verifyLoading ? "Verifying..." : "Upload and verify license"}
          </button>
          {allowDemoBypass ? (
            <button
              type="button"
              onClick={handleDemoBypassVerification}
              disabled={verifyLoading || !isOnline}
              className="rounded-full border border-ink/15 px-5 py-2 text-sm font-semibold text-ink/70 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {verifyLoading ? "Verifying..." : "Use demo verification"}
            </button>
          ) : null}
          {allowDemoBypass ? (
            <p className="text-xs text-ink/50">
              Demo verification is enabled for local testing only.
            </p>
          ) : null}
        </div>
      ) : null}

      <PushNotificationsCard />
    </div>
  );
}
