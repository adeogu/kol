"use client";

import { useEffect, useMemo, useState } from "react";
import { useOnlineStatus } from "@/hooks/use-online-status";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index);
  }
  return output;
}

export function PushNotificationsCard() {
  const isOnline = useOnlineStatus();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const vapidPublicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY ?? "";

  useEffect(() => {
    const init = async () => {
      const hasSupport =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;
      setSupported(hasSupport);
      if (!hasSupport) return;

      setPermission(Notification.permission);
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        setStatus("Push service worker is not active yet.");
        return;
      }
      const existing = await registration.pushManager.getSubscription();
      setSubscribed(Boolean(existing));
    };
    init();
  }, []);

  const readyToEnable = useMemo(
    () => supported && isOnline && permission !== "denied" && Boolean(vapidPublicKey),
    [supported, isOnline, permission, vapidPublicKey],
  );

  const enablePush = async () => {
    if (!readyToEnable) {
      if (!vapidPublicKey) {
        setStatus("Push key is not configured yet.");
      }
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);
      if (nextPermission !== "granted") {
        setStatus("Notifications were not granted.");
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        setStatus("Push service worker is not active yet.");
        return;
      }
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) {
        setStatus("Could not save push subscription.");
        return;
      }

      setSubscribed(true);
      setStatus("Push notifications enabled.");
    } finally {
      setLoading(false);
    }
  };

  const disablePush = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        setSubscribed(false);
        setStatus("Push service worker is not active.");
        return;
      }
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setSubscribed(false);
        setStatus("Push notifications are already off.");
        return;
      }

      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(endpoint)}`, {
        method: "DELETE",
      });

      setSubscribed(false);
      setStatus("Push notifications disabled.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-3xl border border-ink/10 bg-white p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
          Notifications
        </p>
        <h2 className="text-lg font-semibold text-ink">Web push alerts</h2>
      </div>

      {!supported ? (
        <p className="text-sm text-ink/60">
          This browser does not support push notifications.
        </p>
      ) : (
        <p className="text-sm text-ink/60">
          Get alerts for new messages, booking updates, and license decisions.
        </p>
      )}

      {!isOnline ? (
        <p className="rounded-xl border border-amber-300/40 bg-amber-100/70 px-3 py-2 text-xs text-amber-900">
          Reconnect to manage push subscriptions.
        </p>
      ) : null}
      {permission === "denied" ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          Notifications are blocked by your browser settings.
        </p>
      ) : null}
      {!vapidPublicKey ? (
        <p className="rounded-xl border border-ink/15 bg-ink/5 px-3 py-2 text-xs text-ink/60">
          Push is not configured yet (`NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY` missing).
        </p>
      ) : null}
      {status ? (
        <p className="rounded-xl border border-ink/15 bg-ink/5 px-3 py-2 text-xs text-ink/70">
          {status}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={enablePush}
          disabled={loading || subscribed || !readyToEnable}
          className="rounded-full bg-forest px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && !subscribed ? "Enabling..." : "Enable push"}
        </button>
        <button
          type="button"
          onClick={disablePush}
          disabled={loading || !subscribed || !supported}
          className="rounded-full border border-ink/15 px-5 py-2 text-sm font-semibold text-ink/70 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && subscribed ? "Disabling..." : "Disable push"}
        </button>
      </div>
    </div>
  );
}
