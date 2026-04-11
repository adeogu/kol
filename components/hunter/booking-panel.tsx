"use client";

import { useEffect, useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import Link from "next/link";
import { BookingCalendar } from "@/components/hunter/booking-calendar";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { createClient } from "@/lib/supabase/client";
import type { Listing } from "@/types";

type Props = {
  listing: Listing;
};

export function BookingPanel({ listing }: Props) {
  const isOnline = useOnlineStatus();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);

  useEffect(() => {
    let active = true;

    const loadBookedDates = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("bookings")
        .select("start_date,end_date,status")
        .eq("listing_id", listing.id)
        .neq("status", "CANCELLED");

      const bookingRows =
        (data as Array<{
          start_date: string;
          end_date: string;
          status: string;
        }>) ?? [];

      if (!active || error) return;

      const dateKeys = new Set<string>();
      const toKey = (value: Date) => {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, "0");
        const day = String(value.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      bookingRows.forEach((booking) => {
        if (!booking.start_date || !booking.end_date) return;
        let current = new Date(`${booking.start_date}T00:00:00`);
        const end = new Date(`${booking.end_date}T00:00:00`);
        while (current <= end) {
          dateKeys.add(toKey(current));
          current = new Date(
            current.getFullYear(),
            current.getMonth(),
            current.getDate() + 1,
          );
        }
      });

      setDisabledDates(
        Array.from(dateKeys, (key) => new Date(`${key}T00:00:00`)),
      );
    };

    loadBookedDates();

    return () => {
      active = false;
    };
  }, [listing.id]);

  const handleConfirm = async (range: { from: Date; to: Date }) => {
    if (!isOnline) {
      setStatus("error");
      setMessage("You are offline. Reconnect to request this booking.");
      return;
    }

    setStatus("loading");
    setMessage(null);

    const totalDays = differenceInCalendarDays(range.to, range.from) + 1;
    const totalPrice = totalDays * listing.price_per_day;
    const serviceFee = listing.service_fee ?? 2.5;
    const grandTotal = totalPrice + serviceFee;

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setStatus("error");
        setMessage("Please log in to book.");
        return;
      }
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (profileError || !profile) {
        setStatus("error");
        setMessage("Unable to verify your hunter profile right now.");
        return;
      }
      const profileRecord = profile as {
        license_verified?: boolean | null;
        license_status?: string | null;
        license_number?: string | null;
        license_document_url?: string | null;
        first_name?: string | null;
        last_name?: string | null;
        county?: string | null;
        license_expiry_date?: string | null;
      };
      const licenseStatus = profileRecord.license_status;
      const canBook =
        (licenseStatus ? licenseStatus === "VERIFIED" : false) ||
        profileRecord.license_verified === true;
      if (!canBook) {
        setStatus("error");
        setMessage(
          `Your hunting license status is ${licenseStatus ?? "UNVERIFIED"}. Verify it from Profile before booking.`,
        );
        return;
      }

      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          listing_id: listing.id,
          hunter_id: user.id,
          start_date: range.from.toISOString().slice(0, 10),
          end_date: range.to.toISOString().slice(0, 10),
          total_days: totalDays,
          price_per_day: listing.price_per_day,
          total_price: totalPrice,
          service_fee: serviceFee,
          grand_total: grandTotal,
        })
        .select("*")
        .single();

      if (error || !booking) {
        setStatus("error");
        setMessage(error?.message ?? "Unable to create booking.");
        return;
      }

      const { data: latestVerification } = await supabase
        .from("hunter_license_verifications")
        .select("extracted_holder_name, extracted_license_type")
        .eq("hunter_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      await supabase.from("booking_license_snapshots").insert({
        booking_id: booking.id,
        hunter_id: user.id,
        landowner_id: listing.owner_id,
        license_number: profileRecord.license_number ?? null,
        holder_name:
          latestVerification?.extracted_holder_name ??
          ([profileRecord.first_name, profileRecord.last_name]
            .filter(Boolean)
            .join(" ") || null),
        license_type: latestVerification?.extracted_license_type ?? null,
        county: profileRecord.county ?? null,
        expiry_date: profileRecord.license_expiry_date ?? null,
        license_document_url: profileRecord.license_document_url ?? null,
        status: "VERIFIED",
      });
      await fetch("/api/push/booking-created", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      }).catch(() => null);

      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const payload = await response.json();
      if (payload?.url) {
        window.location.href = payload.url;
        return;
      }

      setStatus("success");
      setMessage("Booking requested. Await landowner confirmation.");
    } catch {
      setStatus("error");
      setMessage("Unable to process booking. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      <BookingCalendar
        onConfirm={handleConfirm}
        disabledDates={disabledDates}
        confirmDisabled={!isOnline || status === "loading"}
        confirmDisabledReason={
          !isOnline ? "You are offline. Reconnect to request this booking." : null
        }
      />
      {!isOnline ? (
        <p className="rounded-xl border border-amber-300/40 bg-amber-100/70 px-3 py-2 text-xs text-amber-900">
          Offline mode: booking creation is disabled until your connection returns.
        </p>
      ) : null}
      {status === "success" ? (
        <p className="rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          {message}
        </p>
      ) : null}
      {status === "error" ? (
        <div className="space-y-2 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          <p>{message}</p>
          {message?.includes("license status") ? (
            <Link href="/profile" className="text-xs font-semibold underline">
              Go to profile verification
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
