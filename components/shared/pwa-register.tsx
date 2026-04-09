"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const isProduction = process.env.NODE_ENV === "production";

    const unregisterAll = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(
            keys
              .filter((key) => key.includes("huntstay") || key.startsWith("app-shell-") || key.startsWith("runtime-"))
              .map((key) => caches.delete(key)),
          );
        }
      } catch {
        // Keep app functional when cleanup fails.
      }
    };

    const register = async () => {
      if (!isProduction) {
        await unregisterAll();
        return;
      }
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        // Keep app functional when service worker registration fails.
      }
    };

    register();
  }, []);

  return null;
}
