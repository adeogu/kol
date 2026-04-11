import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createAdminSupabaseMock, stripeMock } = vi.hoisted(() => ({
  createAdminSupabaseMock: vi.fn(),
  stripeMock: {
    paymentIntents: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabase: createAdminSupabaseMock,
}));

vi.mock("@/lib/stripe", () => ({
  stripe: stripeMock,
}));

import { POST } from "@/app/api/payments/create-intent/route";

function createAdminSupabase(params?: {
  booking?:
    | {
        id: string;
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
          grand_total: 133.5,
          listings: { title: "Riverbank Ridge" },
        };

  const single = vi.fn().mockResolvedValue({ data: booking });
  const eqSelect = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq: eqSelect }));

  const updateEq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn(() => ({ eq: updateEq }));

  return {
    from: vi.fn((table: string) => {
      if (table === "bookings") {
        return { select, update };
      }
      throw new Error(`Unexpected table ${table}`);
    }),
    __mocks: {
      update,
      updateEq,
    },
  };
}

describe("create-intent route", () => {
  const originalStripeKey = process.env.STRIPE_SECRET_KEY;

  beforeEach(() => {
    createAdminSupabaseMock.mockReset();
    stripeMock.paymentIntents.create.mockReset();
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
  });

  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = originalStripeKey;
  });

  it("returns 500 when stripe secret missing", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const response = await POST(
      new Request("http://localhost/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: "booking-1" }),
      }),
    );
    expect(response.status).toBe(500);
  });

  it("returns 400 when bookingId missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/payments/create-intent", {
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
      new Request("http://localhost/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: "missing" }),
      }),
    );
    expect(response.status).toBe(404);
  });

  it("creates intent and stores intent id", async () => {
    const supabase = createAdminSupabase();
    createAdminSupabaseMock.mockReturnValue(supabase);
    stripeMock.paymentIntents.create.mockResolvedValue({
      id: "pi_123",
      client_secret: "cs_test",
    });

    const response = await POST(
      new Request("http://localhost/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: "booking-1" }),
      }),
    );
    const payload = (await response.json()) as { clientSecret: string };

    expect(response.status).toBe(200);
    expect(payload.clientSecret).toBe("cs_test");
    expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 13350,
        metadata: expect.objectContaining({
          booking_id: "booking-1",
          listing_title: "Riverbank Ridge",
        }),
      }),
    );
    expect(supabase.__mocks.update).toHaveBeenCalledTimes(1);
  });

  it("uses empty listing title when missing", async () => {
    createAdminSupabaseMock.mockReturnValue(
      createAdminSupabase({
        booking: {
          id: "booking-2",
          grand_total: 80,
          listings: null,
        },
      }),
    );
    stripeMock.paymentIntents.create.mockResolvedValue({
      id: "pi_456",
      client_secret: "cs_other",
    });

    const response = await POST(
      new Request("http://localhost/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: "booking-2" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          listing_title: "",
        }),
      }),
    );
  });

  it("returns 500 when stripe create throws", async () => {
    createAdminSupabaseMock.mockReturnValue(createAdminSupabase());
    stripeMock.paymentIntents.create.mockRejectedValue(new Error("stripe down"));

    const response = await POST(
      new Request("http://localhost/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: "booking-1" }),
      }),
    );

    expect(response.status).toBe(500);
  });
});
