import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./types";

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Supabase env vars are missing.");
  }
  return { url, anon };
}

// For Server Components (read-only cookies; no mutations allowed)
export async function createServerSupabase() {
  const { url, anon } = getEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anon, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set() {
        // No-op: cookies cannot be set in Server Components.
      },
      remove() {
        // No-op: cookies cannot be removed in Server Components.
      },
    },
  });
}

// For Route Handlers / Server Actions (cookie mutations allowed)
export async function createRouteSupabase() {
  const { url, anon } = getEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anon, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name, options) {
        cookieStore.set({ name, value: "", ...options });
      },
    },
  });
}
