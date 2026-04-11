const CACHE_VERSION = "huntstay-v3";
const APP_SHELL = `app-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;
const TILE_CACHE = `tiles-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  OFFLINE_URL,
  "/globe.svg",
  "/file.svg",
];

const OFFLINE_FRIENDLY_PATHS = [
  "/dashboard",
  "/trips",
  "/bookings",
  "/calendar",
  "/saved",
  "/messages",
  "/profile",
  "/properties",
  "/discover",
];

function shouldSkipRequest(url) {
  return (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/") ||
    url.hostname.includes("stripe.com")
  );
}

function isOfflineFriendlyPath(pathname) {
  return OFFLINE_FRIENDLY_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    networkPromise.catch(() => null);
    return cached;
  }

  const networkResponse = await networkPromise;
  return networkResponse || Response.error();
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) =>
              key !== APP_SHELL &&
              key !== RUNTIME_CACHE &&
              key !== IMAGE_CACHE &&
              key !== TILE_CACHE,
          )
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  if (shouldSkipRequest(url)) return;

  // Cache map tiles for smoother browsing with weak signal.
  if (url.hostname.includes("tile.openstreetmap.org")) {
    event.respondWith(staleWhileRevalidate(event.request, TILE_CACHE));
    return;
  }

  // Cache public listing images from Supabase storage.
  if (
    url.hostname.includes("supabase.co") &&
    url.pathname.includes("/storage/v1/object/public/listing-images/")
  ) {
    event.respondWith(staleWhileRevalidate(event.request, IMAGE_CACHE));
    return;
  }

  // Navigation: network first for freshness, cache fallback for key pages.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (response && response.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const pathname = url.pathname;
          if (isOfflineFriendlyPath(pathname)) {
            const shellFallback =
              (await caches.match("/dashboard")) || (await caches.match("/"));
            if (shellFallback) return shellFallback;
          }
          const offline = await caches.match(OFFLINE_URL);
          return offline || Response.error();
        }),
    );
    return;
  }

  // Static assets + same-origin pages: stale-while-revalidate.
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(event.request, RUNTIME_CACHE));
  }
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = payload.title || "HuntStay update";
  const body = payload.body || "You have a new update.";
  const url = payload.url || "/messages";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/globe.svg",
      badge: "/globe.svg",
      data: { url },
      tag: payload.tag || "huntstay-notification",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification?.data?.url || "/messages";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ("focus" in client) {
            client.navigate(target);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(target);
        }
        return undefined;
      }),
  );
});
