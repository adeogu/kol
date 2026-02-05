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

    const bookingRecord = booking as unknown as {
      id: string;
      listing_id: string;
      start_date: string;
      end_date: string;
      grand_total: number;
      listings?: { title?: string | null } | null;
    };

    const amount = Math.round(Number(bookingRecord.grand_total) * 100);
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
              name: bookingRecord.listings?.title ?? "HuntStay booking",
              description: `Booking ${bookingRecord.start_date} - ${bookingRecord.end_date}`,
            },
          },
        },
      ],
      success_url: `${appUrl}/trips?status=success`,
      cancel_url: `${appUrl}/discover/${bookingRecord.listing_id}?status=cancelled`,
      metadata: {
        booking_id: bookingRecord.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json(
      { error: "Unable to create checkout session." },
      { status: 500 },
    );
  }
}
