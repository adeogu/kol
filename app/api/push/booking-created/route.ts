import { NextResponse } from "next/server";
import { z } from "zod";
import { sendPushToUser } from "@/lib/push/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createRouteSupabase } from "@/lib/supabase/server";

const schema = z.object({
  bookingId: z.string().uuid(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid booking payload." }, { status: 400 });
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
    .select("id,listing_id,hunter_id,start_date,end_date")
    .eq("id", parsed.data.bookingId)
    .single();
  if (bookingError || !booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (booking.hunter_id !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: listing, error: listingError } = await admin
    .from("listings")
    .select("id,title,owner_id")
    .eq("id", booking.listing_id)
    .single();
  if (listingError || !listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  await sendPushToUser(listing.owner_id, {
    title: "New booking request",
    body: `${listing.title} has a booking request for ${booking.start_date} to ${booking.end_date}.`,
    url: "/bookings",
    tag: `booking-created-${booking.id}`,
  });

  return NextResponse.json({ ok: true });
}
