"use client";

import { useEffect, useState } from "react";

type DeferredPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<DeferredPromptEvent | null>(null);
  const [hidden, setHidden] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("huntstay:pwa-install-dismissed") === "1";
  });

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as DeferredPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
      return;
    }
    setHidden(true);
    window.localStorage.setItem("huntstay:pwa-install-dismissed", "1");
  };

  const dismiss = () => {
    setHidden(true);
    window.localStorage.setItem("huntstay:pwa-install-dismissed", "1");
  };

  if (!deferredPrompt || hidden) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[1300] md:inset-x-auto md:bottom-5 md:right-5">
      <div className="w-full rounded-2xl border border-ink/10 bg-white/95 p-4 shadow-[0_18px_40px_rgba(17,18,15,0.2)] backdrop-blur md:w-[360px]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest/70">
          Install HuntStay
        </p>
        <p className="mt-2 text-sm text-ink/70">
          Add HuntStay to your home screen for a faster, app-like experience.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleInstall}
            className="rounded-full bg-forest px-4 py-2 text-xs font-semibold text-white transition hover:bg-pine"
          >
            Add to home screen
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink/70"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
