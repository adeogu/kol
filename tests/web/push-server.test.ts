import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

type SubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
};

const originalEnv = process.env;

function createAdmin(params?: {
  queryError?: { message: string } | null;
  subscriptions?: SubscriptionRow[];
}) {
  const subscriptions = params?.subscriptions ?? [];
  const queryError = params?.queryError ?? null;

  const selectIs = vi
    .fn()
    .mockResolvedValue({ data: subscriptions, error: queryError });
  const selectEq = vi.fn(() => ({ is: selectIs }));
  const select = vi.fn(() => ({ eq: selectEq }));

  const updateEq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn(() => ({ eq: updateEq }));

  return {
    from: vi.fn(() => ({
      select,
      update,
    })),
    __mocks: {
      updateEq,
    },
  };
}

async function loadModule(params: {
  admin: ReturnType<typeof createAdmin>;
  sendImplementation?: (payload: { endpoint: string }) => Promise<void>;
}) {
  const setVapidDetails = vi.fn();
  const sendNotification = vi.fn(
    params.sendImplementation
      ? ({ endpoint }: { endpoint: string }) => params.sendImplementation?.({ endpoint })
      : async () => {},
  );
  const createAdminSupabase = vi.fn(() => params.admin);

  vi.doMock("web-push", () => ({
    default: {
      setVapidDetails,
      sendNotification,
    },
  }));

  vi.doMock("@/lib/supabase/admin", () => ({
    createAdminSupabase,
  }));

  const pushModule = await import("@/lib/push/server");
  return {
    ...pushModule,
    mocks: { setVapidDetails, sendNotification, createAdminSupabase },
  };
}

describe("sendPushToUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
    delete process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
    delete process.env.WEB_PUSH_VAPID_SUBJECT;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("skips when vapid keys are missing", async () => {
    const pushService = await loadModule({ admin: createAdmin() });
    const result = await pushService.sendPushToUser("user-1", {
      title: "Title",
      body: "Body",
    });

    expect(result).toEqual({ sent: 0, revoked: 0, skipped: true });
    expect(pushService.mocks.createAdminSupabase).not.toHaveBeenCalled();
  });

  it("returns without sends when there are no active subscriptions", async () => {
    process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY = "public";
    process.env.WEB_PUSH_VAPID_PRIVATE_KEY = "private";
    const admin = createAdmin({ subscriptions: [] });
    const pushService = await loadModule({ admin });

    const result = await pushService.sendPushToUser("user-1", {
      title: "Title",
      body: "Body",
    });

    expect(result).toEqual({ sent: 0, revoked: 0, skipped: false });
    expect(pushService.mocks.setVapidDetails).toHaveBeenCalledTimes(1);
    expect(pushService.mocks.sendNotification).not.toHaveBeenCalled();
  });

  it("sends notifications and revokes expired subscriptions", async () => {
    process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY = "public";
    process.env.WEB_PUSH_VAPID_PRIVATE_KEY = "private";
    const admin = createAdmin({
      subscriptions: [
        {
          id: "sub-1",
          endpoint: "https://push.good/subscription",
          p256dh_key: "p",
          auth_key: "a",
        },
        {
          id: "sub-2",
          endpoint: "https://push.dead/subscription",
          p256dh_key: "p2",
          auth_key: "a2",
        },
      ],
    });
    const pushService = await loadModule({
      admin,
      sendImplementation: async ({ endpoint }) => {
        if (endpoint.includes("dead")) {
          throw { statusCode: 410 };
        }
      },
    });

    const result = await pushService.sendPushToUser("user-1", {
      title: "Title",
      body: "Body",
    });

    expect(result).toEqual({ sent: 1, revoked: 1, skipped: false });
    expect(pushService.mocks.sendNotification).toHaveBeenCalledTimes(2);
    expect(admin.__mocks.updateEq).toHaveBeenCalledWith("id", "sub-2");
  });

  it("handles subscription query errors gracefully", async () => {
    process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY = "public";
    process.env.WEB_PUSH_VAPID_PRIVATE_KEY = "private";
    const pushService = await loadModule({
      admin: createAdmin({ queryError: { message: "boom" } }),
    });

    const result = await pushService.sendPushToUser("user-1", {
      title: "Title",
      body: "Body",
    });

    expect(result).toEqual({ sent: 0, revoked: 0, skipped: false });
  });

  it("keeps subscriptions active on non-expired push errors", async () => {
    process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY = "public";
    process.env.WEB_PUSH_VAPID_PRIVATE_KEY = "private";
    const admin = createAdmin({
      subscriptions: [
        {
          id: "sub-1",
          endpoint: "https://push.fails/subscription",
          p256dh_key: "p",
          auth_key: "a",
        },
      ],
    });
    const pushService = await loadModule({
      admin,
      sendImplementation: async () => {
        throw { statusCode: 500 };
      },
    });

    const result = await pushService.sendPushToUser("user-1", {
      title: "Title",
      body: "Body",
    });

    expect(result).toEqual({ sent: 0, revoked: 0, skipped: false });
    expect(admin.__mocks.updateEq).not.toHaveBeenCalled();
  });

  it("reuses VAPID config on subsequent sends", async () => {
    process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY = "public";
    process.env.WEB_PUSH_VAPID_PRIVATE_KEY = "private";
    process.env.WEB_PUSH_VAPID_SUBJECT = "mailto:test@huntstay.ie";
    const admin = createAdmin({
      subscriptions: [
        {
          id: "sub-1",
          endpoint: "https://push.good/subscription",
          p256dh_key: "p",
          auth_key: "a",
        },
      ],
    });
    const pushService = await loadModule({ admin });

    await pushService.sendPushToUser("user-1", {
      title: "First",
      body: "Body",
    });
    await pushService.sendPushToUser("user-1", {
      title: "Second",
      body: "Body",
    });

    expect(pushService.mocks.setVapidDetails).toHaveBeenCalledTimes(1);
  });
});
