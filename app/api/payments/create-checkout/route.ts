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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: amount,
            product_data: {
              name: booking.listings?.title ?? "HuntStay booking",
              description: `Booking ${booking.start_date} - ${booking.end_date}`,
            },
          },
        },
      ],
      success_url: `${appUrl}/trips?status=success`,
      cancel_url: `${appUrl}/discover/${booking.listing_id}?status=cancelled`,
      metadata: {
        booking_id: booking.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to create checkout session." },
      { status: 500 },
    );
  }
}
