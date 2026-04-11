import { beforeEach, describe, expect, it, vi } from "vitest";

const { createRouteSupabaseMock } = vi.hoisted(() => ({
  createRouteSupabaseMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createRouteSupabase: createRouteSupabaseMock,
}));

import {
  DELETE,
  POST,
} from "@/app/api/push/subscribe/route";

function createSupabase(params?: {
  userId?: string | null;
  upsertError?: { message: string } | null;
  deleteError?: { message: string } | null;
}) {
  const userId = params && "userId" in params ? params.userId : "user-1";
  const upsertError = params?.upsertError ?? null;
  const deleteError = params?.deleteError ?? null;

  const upsert = vi.fn().mockResolvedValue({ error: upsertError });
  const deleteEqSecond = vi.fn().mockResolvedValue({ error: deleteError });
  const deleteEqFirst = vi.fn(() => ({ eq: deleteEqSecond }));
  const update = vi.fn(() => ({ eq: deleteEqFirst }));

  return {
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: userId ? { id: userId } : null } }),
    },
    from: vi.fn(() => ({
      upsert,
      update,
    })),
    __mocks: {
      upsert,
      update,
      deleteEqFirst,
      deleteEqSecond,
    },
  };
}

describe("push subscribe route", () => {
  beforeEach(() => {
    createRouteSupabaseMock.mockReset();
  });

  it("returns 400 for invalid POST payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/push/subscribe", {
        method: "POST",
        body: JSON.stringify({ bad: true }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns 401 when POST user is missing", async () => {
    createRouteSupabaseMock.mockResolvedValue(createSupabase({ userId: null }));

    const response = await POST(
      new Request("http://localhost/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: "https://push.example/subscription",
          keys: { p256dh: "p", auth: "a" },
        }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("saves subscription on POST", async () => {
    const supabase = createSupabase();
    createRouteSupabaseMock.mockResolvedValue(supabase);

    const response = await POST(
      new Request("http://localhost/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", "user-agent": "vitest" },
        body: JSON.stringify({
          endpoint: "https://push.example/subscription",
          keys: { p256dh: "p", auth: "a" },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(supabase.__mocks.upsert).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when POST upsert fails", async () => {
    createRouteSupabaseMock.mockResolvedValue(
      createSupabase({
        upsertError: { message: "db down" },
      }),
    );

    const response = await POST(
      new Request("http://localhost/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: "https://push.example/subscription",
          keys: { p256dh: "p", auth: "a" },
        }),
      }),
    );

    expect(response.status).toBe(500);
  });

  it("returns 400 when DELETE endpoint is missing", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/push/subscribe", { method: "DELETE" }),
    );

    expect(response.status).toBe(400);
  });

  it("returns 401 when DELETE user is missing", async () => {
    createRouteSupabaseMock.mockResolvedValue(createSupabase({ userId: null }));

    const response = await DELETE(
      new Request(
        "http://localhost/api/push/subscribe?endpoint=https%3A%2F%2Fpush.example%2Fsubscription",
        { method: "DELETE" },
      ),
    );

    expect(response.status).toBe(401);
  });

  it("returns 500 when DELETE update fails", async () => {
    createRouteSupabaseMock.mockResolvedValue(
      createSupabase({
        deleteError: { message: "cannot update" },
      }),
    );

    const response = await DELETE(
      new Request(
        "http://localhost/api/push/subscribe?endpoint=https%3A%2F%2Fpush.example%2Fsubscription",
        { method: "DELETE" },
      ),
    );

    expect(response.status).toBe(500);
  });

  it("revokes subscription on DELETE", async () => {
    const supabase = createSupabase();
    createRouteSupabaseMock.mockResolvedValue(supabase);

    const response = await DELETE(
      new Request(
        "http://localhost/api/push/subscribe?endpoint=https%3A%2F%2Fpush.example%2Fsubscription",
        { method: "DELETE" },
      ),
    );

    expect(response.status).toBe(200);
    expect(supabase.__mocks.update).toHaveBeenCalledTimes(1);
  });
});
