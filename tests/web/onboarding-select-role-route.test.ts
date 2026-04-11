import { beforeEach, describe, expect, it, vi } from "vitest";

const { createRouteSupabaseMock, createAdminSupabaseMock } = vi.hoisted(() => ({
  createRouteSupabaseMock: vi.fn(),
  createAdminSupabaseMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createRouteSupabase: createRouteSupabaseMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabase: createAdminSupabaseMock,
}));

import { POST } from "@/app/api/onboarding/select-role/route";

function createRouteSupabase(params?: { id?: string | null; email?: string | null }) {
  const id = params && "id" in params ? params.id : "user-1";
  const email = params && "email" in params ? params.email : "user@example.com";
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: id ? { id, email } : null,
        },
      }),
    },
  };
}

function createAdminSupabase(params?: { upsertError?: { message: string } | null }) {
  const upsertError = params?.upsertError ?? null;
  const upsert = vi.fn().mockResolvedValue({ error: upsertError });
  return {
    from: vi.fn(() => ({ upsert })),
    __mocks: { upsert },
  };
}

describe("onboarding select-role route", () => {
  beforeEach(() => {
    createRouteSupabaseMock.mockReset();
    createAdminSupabaseMock.mockReset();
  });

  it("returns 500 when request body is invalid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/onboarding/select-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{broken",
      }),
    );

    expect(response.status).toBe(500);
  });

  it("returns 400 for invalid role", async () => {
    const response = await POST(
      new Request("http://localhost/api/onboarding/select-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "ADMIN" }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns 401 when user is missing", async () => {
    createRouteSupabaseMock.mockResolvedValue(createRouteSupabase({ id: null }));

    const response = await POST(
      new Request("http://localhost/api/onboarding/select-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "HUNTER" }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("returns 401 when user email is missing", async () => {
    createRouteSupabaseMock.mockResolvedValue(
      createRouteSupabase({ id: "user-1", email: null }),
    );

    const response = await POST(
      new Request("http://localhost/api/onboarding/select-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "LANDOWNER" }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("returns 400 when profile upsert fails", async () => {
    createRouteSupabaseMock.mockResolvedValue(createRouteSupabase());
    createAdminSupabaseMock.mockReturnValue(
      createAdminSupabase({ upsertError: { message: "db failed" } }),
    );

    const response = await POST(
      new Request("http://localhost/api/onboarding/select-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "HUNTER" }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("saves role and onboarding status", async () => {
    const routeSupabase = createRouteSupabase();
    const adminSupabase = createAdminSupabase();
    createRouteSupabaseMock.mockResolvedValue(routeSupabase);
    createAdminSupabaseMock.mockReturnValue(adminSupabase);

    const response = await POST(
      new Request("http://localhost/api/onboarding/select-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "LANDOWNER" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(adminSupabase.from).toHaveBeenCalledWith("profiles");
    expect(adminSupabase.__mocks.upsert).toHaveBeenCalledWith(
      {
        id: "user-1",
        email: "user@example.com",
        role: "LANDOWNER",
        onboarding_completed: true,
      },
      { onConflict: "id" },
    );
  });
});
