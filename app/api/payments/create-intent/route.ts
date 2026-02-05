import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe is not configured." },
        { status: 500 },
      );
    }

    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing bookingId." },
        { status: 400 },
      );
    }

    const supabase = createAdminSupabase();
    const { data: booking } = await supabase
      .from("bookings")
      .select("*, listings(title)")
      .eq("id", bookingId)
      .single();

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const amount = Math.round(Number(booking.grand_total) * 100);
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: "eur",
      metadata: {
        booking_id: booking.id,
        listing_title: booking.listings?.title ?? "",
      },
    });

    await supabase
      .from("bookings")
      .update({ stripe_payment_intent_id: intent.id })
      .eq("id", booking.id);

    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to create payment intent." },
      { status: 500 },
    );
  }
}
