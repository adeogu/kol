import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { stripeMock, createAdminSupabaseMock } = vi.hoisted(() => ({
  stripeMock: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
  createAdminSupabaseMock: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: stripeMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabase: createAdminSupabaseMock,
}));

import { POST } from "@/app/api/webhooks/stripe/route";

function createAdminSupabase() {
  const eq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn(() => ({ eq }));
  return {
    from: vi.fn(() => ({ update })),
    __mocks: { update, eq },
  };
}

function webhookRequest(signature?: string) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (signature) {
    headers.set("stripe-signature", signature);
  }
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers,
    body: JSON.stringify({ id: "evt_1" }),
  });
}

describe("stripe webhook route", () => {
  const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;

  beforeEach(() => {
    stripeMock.webhooks.constructEvent.mockReset();
    createAdminSupabaseMock.mockReset();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  });

  afterEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
  });

  it("returns 400 when signature missing", async () => {
    const response = await POST(webhookRequest(undefined));
    expect(response.status).toBe(400);
  });

  it("returns 400 when webhook secret missing", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const response = await POST(webhookRequest("sig"));
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid signature", async () => {
    stripeMock.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("invalid");
    });
    const response = await POST(webhookRequest("sig"));
    expect(response.status).toBe(400);
  });

  it("marks booking as paid for checkout.session.completed", async () => {
    const admin = createAdminSupabase();
    createAdminSupabaseMock.mockReturnValue(admin);
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { metadata: { booking_id: "booking-1" } } },
    });

    const response = await POST(webhookRequest("sig"));
    expect(response.status).toBe(200);
    expect(admin.__mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ paid_at: expect.any(String) }),
    );
  });

  it("marks booking as paid for payment_intent.succeeded", async () => {
    const admin = createAdminSupabase();
    createAdminSupabaseMock.mockReturnValue(admin);
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: { object: { metadata: { booking_id: "booking-2" } } },
    });

    const response = await POST(webhookRequest("sig"));
    expect(response.status).toBe(200);
    expect(admin.__mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ paid_at: expect.any(String) }),
    );
  });

  it("marks booking cancelled for payment_intent.payment_failed", async () => {
    const admin = createAdminSupabase();
    createAdminSupabaseMock.mockReturnValue(admin);
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: "payment_intent.payment_failed",
      data: { object: { metadata: { booking_id: "booking-3" } } },
    });

    const response = await POST(webhookRequest("sig"));
    expect(response.status).toBe(200);
    expect(admin.__mocks.update).toHaveBeenCalledWith({ status: "CANCELLED" });
  });

  it("marks booking cancelled for payment_intent.canceled", async () => {
    const admin = createAdminSupabase();
    createAdminSupabaseMock.mockReturnValue(admin);
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: "payment_intent.canceled",
      data: { object: { metadata: { booking_id: "booking-4" } } },
    });

    const response = await POST(webhookRequest("sig"));
    expect(response.status).toBe(200);
    expect(admin.__mocks.update).toHaveBeenCalledWith({ status: "CANCELLED" });
  });

  it("returns success for unhandled event type", async () => {
    const admin = createAdminSupabase();
    createAdminSupabaseMock.mockReturnValue(admin);
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: "customer.created",
      data: { object: { metadata: {} } },
    });

    const response = await POST(webhookRequest("sig"));
    const payload = (await response.json()) as { received: boolean };
    expect(response.status).toBe(200);
    expect(payload.received).toBe(true);
    expect(admin.__mocks.update).not.toHaveBeenCalled();
  });

  it("skips update when booking metadata missing", async () => {
    const admin = createAdminSupabase();
    createAdminSupabaseMock.mockReturnValue(admin);
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { metadata: {} } },
    });

    const response = await POST(webhookRequest("sig"));
    expect(response.status).toBe(200);
    expect(admin.__mocks.update).not.toHaveBeenCalled();
  });
});
