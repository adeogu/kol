import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  table: "messages" | "bookings";
  filter?: string;
  onChange: () => void;
  immediate?: boolean;
};

export function useRealtime({ table, filter, onChange, immediate }: Props) {
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`realtime:${table}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter,
        },
        () => onChange(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, onChange, immediate]);

  useEffect(() => {
    if (!immediate) return;
    const handle = setTimeout(() => {
      onChange();
    }, 0);
    return () => clearTimeout(handle);
  }, [immediate, onChange]);
}
