import { NextResponse } from "next/server";
import { z } from "zod";
import { sendPushToUser } from "@/lib/push/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createRouteSupabase } from "@/lib/supabase/server";

const bodySchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED"]),
});

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const parsedBody = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid status payload." }, { status: 400 });
  }

  const supabase = await createRouteSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const admin = createAdminSupabase();
  const { data: booking, error: bookingError } = await admin
    .from("bookings")
    .select("id,listing_id,hunter_id,start_date,end_date,status")
    .eq("id", id)
    .single();
  if (bookingError || !booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const { data: listing, error: listingError } = await admin
    .from("listings")
    .select("id,title,owner_id")
    .eq("id", booking.listing_id)
    .single();
  if (listingError || !listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  if (listing.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (booking.status !== "PENDING") {
    return NextResponse.json(
      { error: "Only pending bookings can be updated." },
      { status: 409 },
    );
  }

  const nextStatus = parsedBody.data.status;
  const { error: updateError } = await admin
    .from("bookings")
    .update({
      status: nextStatus,
      confirmed_at: nextStatus === "CONFIRMED" ? new Date().toISOString() : null,
      cancelled_at: nextStatus === "CANCELLED" ? new Date().toISOString() : null,
    })
    .eq("id", booking.id);
  if (updateError) {
    return NextResponse.json(
      { error: "Unable to update booking status." },
      { status: 500 },
    );
  }

  await sendPushToUser(booking.hunter_id, {
    title:
      nextStatus === "CONFIRMED"
        ? "Booking confirmed"
        : "Booking request declined",
    body:
      nextStatus === "CONFIRMED"
        ? `${listing.title} is confirmed for ${booking.start_date} to ${booking.end_date}.`
        : `${listing.title} was declined by the landowner.`,
    url: "/trips",
    tag: `booking-${booking.id}`,
  });

  return NextResponse.json({ ok: true, status: nextStatus });
}
