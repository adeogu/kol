import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type UserRole = "HUNTER" | "LANDOWNER" | "ADMIN";

export function useRole() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRole = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setRole((data?.role as UserRole) ?? null);
      setLoading(false);
    };
    loadRole();
  }, []);

  return { role, loading };
}
