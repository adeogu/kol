import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  table: "messages" | "bookings";
  filter?: string;
  onChange: () => void;
};

export function useRealtime({ table, filter, onChange }: Props) {
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
  }, [table, filter, onChange]);
}
