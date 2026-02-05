import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export type Role = "HUNTER" | "LANDOWNER" | "ADMIN";

export async function getServerUser() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function getProfile() {
  const user = await getServerUser();
  if (!user) return null;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return data ?? null;
}

export async function requireUser() {
  const user = await getServerUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(required: Role) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role === "ADMIN") return profile;
  if (profile.role !== required) {
    if (profile.role === "HUNTER") redirect("/dashboard");
    if (profile.role === "LANDOWNER") redirect("/dashboard");
    redirect("/onboarding");
  }
  return profile;
}
