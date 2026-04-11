import { beforeEach, describe, expect, it, vi } from "vitest";

const { createRouteSupabaseMock, createAdminSupabaseMock, sendPushToUserMock } =
  vi.hoisted(() => ({
    createRouteSupabaseMock: vi.fn(),
    createAdminSupabaseMock: vi.fn(),
    sendPushToUserMock: vi.fn(),
  }));

vi.mock("@/lib/supabase/server", () => ({
  createRouteSupabase: createRouteSupabaseMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabase: createAdminSupabaseMock,
}));

vi.mock("@/lib/push/server", () => ({
  sendPushToUser: sendPushToUserMock,
}));

import { PATCH } from "@/app/api/bookings/[id]/status/route";

function createRouteSupabase(userId: string | null = "landowner-1") {
  return {
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: userId ? { id: userId } : null } }),
    },
  };
}

function createAdminSupabase(params?: {
  booking?: {
    id: string;
    listing_id: string;
    hunter_id: string;
    start_date: string;
    end_date: string;
    status: string;
  } | null;
  bookingError?: { message: string } | null;
  listing?: {
    id: string;
    title: string;
    owner_id: string;
  } | null;
  listingError?: { message: string } | null;
  updateError?: { message: string } | null;
}) {
  const booking =
    params?.booking ??
    ({
      id: "booking-1",
      listing_id: "listing-1",
      hunter_id: "hunter-1",
      start_date: "2026-06-01",
      end_date: "2026-06-03",
      status: "PENDING",
    } as const);
  const listing =
    params?.listing ??
    ({
      id: "listing-1",
      title: "Woodland field",
      owner_id: "landowner-1",
    } as const);

  const bookingSingle = vi
    .fn()
    .mockResolvedValue({ data: booking, error: params?.bookingError ?? null });
  const bookingEq = vi.fn(() => ({ single: bookingSingle }));
  const bookingSelect = vi.fn(() => ({ eq: bookingEq }));
  const bookingUpdateEq = vi
    .fn()
    .mockResolvedValue({ error: params?.updateError ?? null });
  const bookingUpdate = vi.fn(() => ({ eq: bookingUpdateEq }));

  const listingSingle = vi
    .fn()
    .mockResolvedValue({ data: listing, error: params?.listingError ?? null });
  const listingEq = vi.fn(() => ({ single: listingSingle }));
  const listingSelect = vi.fn(() => ({ eq: listingEq }));

  return {
    from: vi.fn((table: string) => {
      if (table === "bookings") {
        return {
          select: bookingSelect,
          update: bookingUpdate,
        };
      }
      if (table === "listings") {
        return { select: listingSelect };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
    __mocks: {
      bookingUpdate,
      bookingUpdateEq,
    },
  };
}

describe("booking status route", () => {
  beforeEach(() => {
    createRouteSupabaseMock.mockReset();
    createAdminSupabaseMock.mockReset();
    sendPushToUserMock.mockReset();
    sendPushToUserMock.mockResolvedValue({ sent: 1, revoked: 0, skipped: false });
  });

  it("returns 400 for invalid payload", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/bookings/booking-1/status", {
        method: "PATCH",
        body: JSON.stringify({ status: "PENDING" }),
      }),
      { params: Promise.resolve({ id: "booking-1" }) },
    );
    expect(response.status).toBe(400);
  });

  it("returns 401 when user missing", async () => {
    createRouteSupabaseMock.mockResolvedValue(createRouteSupabase(null));

    const response = await PATCH(
      new Request("http://localhost/api/bookings/booking-1/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
      }),
      { params: Promise.resolve({ id: "booking-1" }) },
    );
    expect(response.status).toBe(401);
  });

  it("returns 404 when booking missing", async () => {
    createRouteSupabaseMock.mockResolvedValue(createRouteSupabase());
    createAdminSupabaseMock.mockReturnValue(
      createAdminSupabase({
        booking: null,
        bookingError: { message: "missing" },
      }),
    );

    const response = await PATCH(
      new Request("http://localhost/api/bookings/booking-1/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
      }),
      { params: Promise.resolve({ id: "booking-1" }) },
    );
    expect(response.status).toBe(404);
  });

  it("returns 404 when listing missing", async () => {
    createRouteSupabaseMock.mockResolvedValue(createRouteSupabase());
    createAdminSupabaseMock.mockReturnValue(
      createAdminSupabase({
        listing: null,
        listingError: { message: "missing" },
      }),
    );

    const response = await PATCH(
      new Request("http://localhost/api/bookings/booking-1/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
      }),
      { params: Promise.resolve({ id: "booking-1" }) },
    );
    expect(response.status).toBe(404);
  });

  it("returns 403 when actor is not listing owner", async () => {
    createRouteSupabaseMock.mockResolvedValue(createRouteSupabase("other-owner"));
    createAdminSupabaseMock.mockReturnValue(createAdminSupabase());

    const response = await PATCH(
      new Request("http://localhost/api/bookings/booking-1/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
      }),
      { params: Promise.resolve({ id: "booking-1" }) },
    );
    expect(response.status).toBe(403);
  });

  it("returns 409 when booking is not pending", async () => {
    createRouteSupabaseMock.mockResolvedValue(createRouteSupabase());
    createAdminSupabaseMock.mockReturnValue(
      createAdminSupabase({
        booking: {
          id: "booking-1",
          listing_id: "listing-1",
          hunter_id: "hunter-1",
          start_date: "2026-06-01",
          end_date: "2026-06-03",
          status: "CONFIRMED",
        },
      }),
    );

    const response = await PATCH(
      new Request("http://localhost/api/bookings/booking-1/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      }),
      { params: Promise.resolve({ id: "booking-1" }) },
    );
    expect(response.status).toBe(409);
  });

  it("returns 500 when update fails", async () => {
    createRouteSupabaseMock.mockResolvedValue(createRouteSupabase());
    createAdminSupabaseMock.mockReturnValue(
      createAdminSupabase({
        updateError: { message: "cannot update" },
      }),
    );

    const response = await PATCH(
      new Request("http://localhost/api/bookings/booking-1/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
      }),
      { params: Promise.resolve({ id: "booking-1" }) },
    );
    expect(response.status).toBe(500);
  });

  it("updates booking to confirmed and pushes hunter alert", async () => {
    createRouteSupabaseMock.mockResolvedValue(createRouteSupabase());
    const admin = createAdminSupabase();
    createAdminSupabaseMock.mockReturnValue(admin);

    const response = await PATCH(
      new Request("http://localhost/api/bookings/booking-1/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
      }),
      { params: Promise.resolve({ id: "booking-1" }) },
    );

    expect(response.status).toBe(200);
    expect(admin.__mocks.bookingUpdate).toHaveBeenCalledTimes(1);
    expect(sendPushToUserMock).toHaveBeenCalledWith(
      "hunter-1",
      expect.objectContaining({ title: "Booking confirmed", url: "/trips" }),
    );
  });

  it("updates booking to cancelled and pushes hunter alert", async () => {
    createRouteSupabaseMock.mockResolvedValue(createRouteSupabase());
    createAdminSupabaseMock.mockReturnValue(createAdminSupabase());

    const response = await PATCH(
      new Request("http://localhost/api/bookings/booking-1/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      }),
      { params: Promise.resolve({ id: "booking-1" }) },
    );

    expect(response.status).toBe(200);
    expect(sendPushToUserMock).toHaveBeenCalledWith(
      "hunter-1",
      expect.objectContaining({
        title: "Booking request declined",
      }),
    );
  });
});
