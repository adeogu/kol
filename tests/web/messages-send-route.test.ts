import { beforeEach, describe, expect, it, vi } from "vitest";

const { createRouteSupabaseMock, sendPushToUserMock } = vi.hoisted(() => ({
  createRouteSupabaseMock: vi.fn(),
  sendPushToUserMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createRouteSupabase: createRouteSupabaseMock,
}));

vi.mock("@/lib/push/server", () => ({
  sendPushToUser: sendPushToUserMock,
}));

import { POST } from "@/app/api/messages/send/route";

function createSupabase(params?: {
  userId?: string | null;
  conversation?: {
    id: string;
    hunter_id: string;
    landowner_id: string;
  } | null;
  conversationError?: { message: string } | null;
  insertError?: { message: string } | null;
}) {
  const userId = params && "userId" in params ? params.userId : "hunter-1";
  const conversation =
    params?.conversation ??
    ({
      id: "conv-1",
      hunter_id: "hunter-1",
      landowner_id: "landowner-1",
    } as const);
  const conversationError = params?.conversationError ?? null;
  const insertError = params?.insertError ?? null;

  const conversationSingle = vi
    .fn()
    .mockResolvedValue({ data: conversation, error: conversationError });
  const conversationEq = vi.fn(() => ({ single: conversationSingle }));
  const conversationSelect = vi.fn(() => ({ eq: conversationEq }));

  const messageInsert = vi.fn().mockResolvedValue({ error: insertError });

  return {
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: userId ? { id: userId } : null } }),
    },
    from: vi.fn((table: string) => {
      if (table === "conversations") {
        return { select: conversationSelect };
      }
      if (table === "messages") {
        return { insert: messageInsert };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
    __mocks: {
      messageInsert,
    },
  };
}

describe("messages send route", () => {
  beforeEach(() => {
    createRouteSupabaseMock.mockReset();
    sendPushToUserMock.mockReset();
    sendPushToUserMock.mockResolvedValue({ sent: 1, revoked: 0, skipped: false });
  });

  it("returns 400 for invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/messages/send", {
        method: "POST",
        body: JSON.stringify({ conversationId: "bad", content: "" }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns 401 when user is missing", async () => {
    createRouteSupabaseMock.mockResolvedValue(createSupabase({ userId: null }));

    const response = await POST(
      new Request("http://localhost/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: "f14e6ce8-2092-45d5-9cab-0e1f6a1e7b6d",
          content: "Hello",
        }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("returns 404 when conversation is not found", async () => {
    createRouteSupabaseMock.mockResolvedValue(
      createSupabase({ conversation: null, conversationError: { message: "missing" } }),
    );

    const response = await POST(
      new Request("http://localhost/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: "f14e6ce8-2092-45d5-9cab-0e1f6a1e7b6d",
          content: "Hello",
        }),
      }),
    );

    expect(response.status).toBe(404);
  });

  it("returns 403 when user is not a participant", async () => {
    createRouteSupabaseMock.mockResolvedValue(
      createSupabase({
        userId: "random-user",
        conversation: {
          id: "conv-1",
          hunter_id: "hunter-1",
          landowner_id: "landowner-1",
        },
      }),
    );

    const response = await POST(
      new Request("http://localhost/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: "f14e6ce8-2092-45d5-9cab-0e1f6a1e7b6d",
          content: "Hello",
        }),
      }),
    );

    expect(response.status).toBe(403);
  });

  it("returns 500 when insert fails", async () => {
    createRouteSupabaseMock.mockResolvedValue(
      createSupabase({ insertError: { message: "insert failed" } }),
    );

    const response = await POST(
      new Request("http://localhost/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: "f14e6ce8-2092-45d5-9cab-0e1f6a1e7b6d",
          content: "Hello",
        }),
      }),
    );

    expect(response.status).toBe(500);
  });

  it("sends message and push notification for participant", async () => {
    const supabase = createSupabase({
      userId: "hunter-1",
      conversation: {
        id: "conv-1",
        hunter_id: "hunter-1",
        landowner_id: "landowner-1",
      },
    });
    createRouteSupabaseMock.mockResolvedValue(supabase);

    const response = await POST(
      new Request("http://localhost/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: "f14e6ce8-2092-45d5-9cab-0e1f6a1e7b6d",
          content: "New message",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(supabase.__mocks.messageInsert).toHaveBeenCalledTimes(1);
    expect(sendPushToUserMock).toHaveBeenCalledWith(
      "landowner-1",
      expect.objectContaining({
        title: "New HuntStay message",
      }),
    );
  });

  it("routes recipient to hunter when landowner is sender", async () => {
    createRouteSupabaseMock.mockResolvedValue(
      createSupabase({
        userId: "landowner-1",
        conversation: {
          id: "conv-1",
          hunter_id: "hunter-1",
          landowner_id: "landowner-1",
        },
      }),
    );

    const response = await POST(
      new Request("http://localhost/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: "f14e6ce8-2092-45d5-9cab-0e1f6a1e7b6d",
          content: "Landowner reply",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(sendPushToUserMock).toHaveBeenCalledWith(
      "hunter-1",
      expect.objectContaining({
        title: "New HuntStay message",
      }),
    );
  });
});
