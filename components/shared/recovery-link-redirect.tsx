"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function RecoveryLinkRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/reset-password") return;

    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

    const queryType = query.get("type");
    const hashType = hash.get("type");
    const errorCode = query.get("error_code") ?? hash.get("error_code");

    const hasRecoveryType = queryType === "recovery" || hashType === "recovery";
    const hasRecoveryToken = Boolean(
      query.get("code") ||
        query.get("token_hash") ||
        hash.get("access_token") ||
        hash.get("refresh_token"),
    );
    const hasRecoveryError = errorCode === "otp_expired";

    if (!hasRecoveryType && !hasRecoveryError) return;
    if (!hasRecoveryToken && !hasRecoveryError) return;

    window.location.replace(
      `/reset-password${window.location.search}${window.location.hash}`,
    );
  }, [pathname]);

  return null;
}
