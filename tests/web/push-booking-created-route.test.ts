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

import { POST } from "@/app/api/push/booking-created/route";

function createRouteSupabase(userId: string | null = "hunter-1") {
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
  } | null;
  bookingError?: { message: string } | null;
  listing?: {
    id: string;
    title: string;
    owner_id: string;
  } | null;
  listingError?: { message: string } | null;
}) {
  const booking =
    params?.booking ??
    ({
      id: "booking-1",
      listing_id: "listing-1",
      hunter_id: "hunter-1",
      start_date: "2026-05-01",
      end_date: "2026-05-03",
    } as const);
  const listing =
    params?.listing ??
    ({
      id: "listing-1",
      title: "Lake estate",
      owner_id: "landowner-1",
    } as const);

  const bookingSingle = vi
    .fn()
    .mockResolvedValue({ data: booking, error: params?.bookingError ?? null });
  const bookingEq = vi.fn(() => ({ single: bookingSingle }));
  const bookingSelect = vi.fn(() => ({ eq: bookingEq }));

  const listingSingle = vi
    .fn()
    .mockResolvedValue({ data: listing, error: params?.listingError ?? null });
  const listingEq = vi.fn(() => ({ single: listingSingle }));
  const listingSelect = vi.fn(() => ({ eq: listingEq }));

  return {
    from: vi.fn((table: string) => {
      if (table === "bookings") return { select: bookingSelect };
      if (table === "listings") return { select: listingSelect };
      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

describe("push booking created route", () => {
  beforeEach(() => {
    createRouteSupabaseMock.mockReset();
    createAdminSupabaseMock.mockReset();
    sendPushToUserMock.mockReset();
    sendPushToUserMock.mockResolvedValue({ sent: 1, revoked: 0, skipped: false });
  });

  it("returns 400 for invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/push/booking-created", {
        method: "POST",
        body: JSON.stringify({ bad: true }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("returns 401 when user missing", async () => {
    createRouteSupabaseMock.mockResolvedValue(createRouteSupabase(null));

    const response = await POST(
      new Request("http://localhost/api/push/booking-created", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: "c8a33453-1f7e-4f5f-b9c8-ec0d4c138ad4",
        }),
      }),
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

    const response = await POST(
      new Request("http://localhost/api/push/booking-created", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: "c8a33453-1f7e-4f5f-b9c8-ec0d4c138ad4",
        }),
      }),
    );
    expect(response.status).toBe(404);
  });

  it("returns 403 when hunter does not own booking", async () => {
    createRouteSupabaseMock.mockResolvedValue(createRouteSupabase("hunter-2"));
    createAdminSupabaseMock.mockReturnValue(createAdminSupabase());

    const response = await POST(
      new Request("http://localhost/api/push/booking-created", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: "c8a33453-1f7e-4f5f-b9c8-ec0d4c138ad4",
        }),
      }),
    );
    expect(response.status).toBe(403);
  });

  it("returns 404 when listing missing", async () => {
    createRouteSupabaseMock.mockResolvedValue(createRouteSupabase());
    createAdminSupabaseMock.mockReturnValue(
      createAdminSupabase({
        listing: null,
        listingError: { message: "missing" },
      }),
    );

    const response = await POST(
      new Request("http://localhost/api/push/booking-created", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: "c8a33453-1f7e-4f5f-b9c8-ec0d4c138ad4",
        }),
      }),
    );
    expect(response.status).toBe(404);
  });

  it("sends notification to landowner on success", async () => {
    createRouteSupabaseMock.mockResolvedValue(createRouteSupabase());
    createAdminSupabaseMock.mockReturnValue(createAdminSupabase());

    const response = await POST(
      new Request("http://localhost/api/push/booking-created", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: "c8a33453-1f7e-4f5f-b9c8-ec0d4c138ad4",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(sendPushToUserMock).toHaveBeenCalledWith(
      "landowner-1",
      expect.objectContaining({
        title: "New booking request",
        url: "/bookings",
      }),
    );
  });
});
