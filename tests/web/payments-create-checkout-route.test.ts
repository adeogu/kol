import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createAdminSupabaseMock, stripeMock } = vi.hoisted(() => ({
  createAdminSupabaseMock: vi.fn(),
  stripeMock: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabase: createAdminSupabaseMock,
}));

vi.mock("@/lib/stripe", () => ({
  stripe: stripeMock,
}));

import { POST } from "@/app/api/payments/create-checkout/route";

function createAdminSupabase(params?: {
  booking?:
    | {
        id: string;
        listing_id: string;
        start_date: string;
        end_date: string;
        grand_total: number;
        listings?: { title?: string | null } | null;
      }
    | null;
}) {
  const booking =
    "booking" in (params ?? {})
      ? params?.booking
      : {
          id: "booking-1",
          listing_id: "listing-1",
          start_date: "2026-07-01",
          end_date: "2026-07-03",
          grand_total: 120,
          listings: { title: "Forest Edge" },
        };

  const single = vi.fn().mockResolvedValue({ data: booking });
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  return {
    from: vi.fn(() => ({ select })),
    __mocks: { single },
  };
}

describe("create-checkout route", () => {
  const originalStripeKey = process.env.STRIPE_SECRET_KEY;
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    createAdminSupabaseMock.mockReset();
    stripeMock.checkout.sessions.create.mockReset();
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.NEXT_PUBLIC_APP_URL = "https://huntstay.test";
  });

  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = originalStripeKey;
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
  });

  it("returns 500 when stripe secret missing", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const response = await POST(
      new Request("http://localhost/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: "booking-1" }),
      }),
    );
    expect(response.status).toBe(500);
  });

  it("returns 400 when bookingId missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("returns 404 when booking not found", async () => {
    createAdminSupabaseMock.mockReturnValue(
      createAdminSupabase({ booking: null }),
    );

    const response = await POST(
      new Request("http://localhost/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: "missing" }),
      }),
    );
    expect(response.status).toBe(404);
  });

  it("creates checkout session with listing title", async () => {
    createAdminSupabaseMock.mockReturnValue(createAdminSupabase());
    stripeMock.checkout.sessions.create.mockResolvedValue({
      url: "https://stripe.test/checkout/session-1",
    });

    const response = await POST(
      new Request("http://localhost/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: "booking-1" }),
      }),
    );
    const payload = (await response.json()) as { url: string };

    expect(response.status).toBe(200);
    expect(payload.url).toBe("https://stripe.test/checkout/session-1");
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: "https://huntstay.test/trips?status=success",
        cancel_url: "https://huntstay.test/discover/listing-1?status=cancelled",
      }),
    );
  });

  it("falls back to localhost app url and default title", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    createAdminSupabaseMock.mockReturnValue(
      createAdminSupabase({
        booking: {
          id: "booking-2",
          listing_id: "listing-2",
          start_date: "2026-07-10",
          end_date: "2026-07-11",
          grand_total: 90,
          listings: null,
        },
      }),
    );
    stripeMock.checkout.sessions.create.mockResolvedValue({
      url: "https://stripe.test/checkout/session-2",
    });

    const response = await POST(
      new Request("http://localhost/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: "booking-2" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              product_data: expect.objectContaining({
                name: "HuntStay booking",
              }),
            }),
          }),
        ],
        success_url: "http://localhost:3000/trips?status=success",
      }),
    );
  });

  it("returns 500 when stripe checkout throws", async () => {
    createAdminSupabaseMock.mockReturnValue(createAdminSupabase());
    stripeMock.checkout.sessions.create.mockRejectedValue(new Error("stripe down"));

    const response = await POST(
      new Request("http://localhost/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: "booking-1" }),
      }),
    );

    expect(response.status).toBe(500);
  });
});
