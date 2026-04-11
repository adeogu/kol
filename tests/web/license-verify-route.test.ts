import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

import { POST } from "@/app/api/license/verify/route";

const HUNTER_ID = "11111111-1111-4111-8111-111111111111";

function createSupabase(params?: {
  userId?: string | null;
  profileError?: { message: string } | null;
}) {
  const userId = params && "userId" in params ? params.userId : HUNTER_ID;
  const profileError = params?.profileError ?? null;

  const profileEq = vi.fn().mockResolvedValue({ error: profileError });
  const profileUpdate = vi.fn(() => ({ eq: profileEq }));
  const insert = vi.fn().mockResolvedValue({ error: null });

  return {
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: userId ? { id: userId } : null } }),
    },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return { update: profileUpdate };
      }
      if (table === "hunter_license_verifications") {
        return { insert };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
    __mocks: {
      profileUpdate,
      profileEq,
      insert,
    },
  };
}

function requestBody(overrides?: Record<string, unknown>) {
  return {
    hunterId: HUNTER_ID,
    licenseDocumentUrl: "https://example.com/license.jpg",
    declaredLicenseNumber: "NARGC-12345",
    county: "Westmeath",
    ...overrides,
  };
}

describe("license verify route", () => {
  const originalEndpoint = process.env.LICENSE_VERIFICATION_SERVICE_URL;
  const originalToken = process.env.LICENSE_VERIFICATION_SERVICE_TOKEN;
  const originalMode = process.env.LICENSE_VERIFICATION_FALLBACK_MODE;
  const originalDemoBypass = process.env.LICENSE_VERIFICATION_ALLOW_DEMO_BYPASS;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    createRouteSupabaseMock.mockReset();
    sendPushToUserMock.mockReset();
    sendPushToUserMock.mockResolvedValue({ sent: 1, revoked: 0, skipped: false });
    delete process.env.LICENSE_VERIFICATION_SERVICE_URL;
    delete process.env.LICENSE_VERIFICATION_SERVICE_TOKEN;
    delete process.env.LICENSE_VERIFICATION_FALLBACK_MODE;
    delete process.env.LICENSE_VERIFICATION_ALLOW_DEMO_BYPASS;
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    process.env.LICENSE_VERIFICATION_SERVICE_URL = originalEndpoint;
    process.env.LICENSE_VERIFICATION_SERVICE_TOKEN = originalToken;
    process.env.LICENSE_VERIFICATION_FALLBACK_MODE = originalMode;
    process.env.LICENSE_VERIFICATION_ALLOW_DEMO_BYPASS = originalDemoBypass;
    process.env.NODE_ENV = originalNodeEnv;
    vi.unstubAllGlobals();
  });

  it("returns 400 for invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/license/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hunterId: "bad" }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("returns 401 when user missing", async () => {
    createRouteSupabaseMock.mockResolvedValue(createSupabase({ userId: null }));

    const response = await POST(
      new Request("http://localhost/api/license/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody()),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("returns 400 when document URL is missing without demo bypass", async () => {
    createRouteSupabaseMock.mockResolvedValue(createSupabase());
    const response = await POST(
      new Request("http://localhost/api/license/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody({ licenseDocumentUrl: null })),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("returns 403 when user does not match hunter", async () => {
    createRouteSupabaseMock.mockResolvedValue(
      createSupabase({ userId: "22222222-2222-4222-8222-222222222222" }),
    );

    const response = await POST(
      new Request("http://localhost/api/license/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody()),
      }),
    );
    expect(response.status).toBe(403);
  });

  it("fallback rejects invalid declared number", async () => {
    const supabase = createSupabase();
    createRouteSupabaseMock.mockResolvedValue(supabase);

    const response = await POST(
      new Request("http://localhost/api/license/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody({ declaredLicenseNumber: "x" })),
      }),
    );
    const payload = (await response.json()) as { status: string; reasons: string[] };

    expect(response.status).toBe(200);
    expect(payload.status).toBe("REJECTED");
    expect(payload.reasons[0]).toContain("Unable to validate declared license number format");
    expect(supabase.__mocks.profileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        license_status: "REJECTED",
        license_verified: false,
        license_verified_at: null,
      }),
    );
  });

  it("fallback verifies valid number when mode verify_valid", async () => {
    process.env.LICENSE_VERIFICATION_FALLBACK_MODE = "verify_valid";
    const supabase = createSupabase();
    createRouteSupabaseMock.mockResolvedValue(supabase);

    const response = await POST(
      new Request("http://localhost/api/license/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody({ declaredLicenseNumber: " nargc-99999 " })),
      }),
    );
    const payload = (await response.json()) as { status: string };

    expect(response.status).toBe(200);
    expect(payload.status).toBe("VERIFIED");
    expect(sendPushToUserMock).toHaveBeenCalledWith(
      HUNTER_ID,
      expect.objectContaining({ tag: "license-verified" }),
    );
    expect(supabase.__mocks.insert).toHaveBeenCalledTimes(1);
  });

  it("uses demo bypass when enabled", async () => {
    process.env.LICENSE_VERIFICATION_ALLOW_DEMO_BYPASS = "true";
    const supabase = createSupabase();
    createRouteSupabaseMock.mockResolvedValue(supabase);

    const response = await POST(
      new Request("http://localhost/api/license/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          requestBody({
            licenseDocumentUrl: null,
            declaredLicenseNumber: "demo-12345",
            useDemoBypass: true,
          }),
        ),
      }),
    );
    const payload = (await response.json()) as { status: string };

    expect(response.status).toBe(200);
    expect(payload.status).toBe("VERIFIED");
    expect(supabase.__mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        license_document_url: null,
      }),
    );
  });

  it("returns 403 when demo bypass is disabled", async () => {
    process.env.LICENSE_VERIFICATION_ALLOW_DEMO_BYPASS = "false";
    createRouteSupabaseMock.mockResolvedValue(createSupabase());

    const response = await POST(
      new Request("http://localhost/api/license/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          requestBody({
            useDemoBypass: true,
            licenseDocumentUrl: null,
          }),
        ),
      }),
    );

    expect(response.status).toBe(403);
  });

  it("allows demo bypass by default in development", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.LICENSE_VERIFICATION_ALLOW_DEMO_BYPASS;
    const supabase = createSupabase();
    createRouteSupabaseMock.mockResolvedValue(supabase);

    const response = await POST(
      new Request("http://localhost/api/license/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          requestBody({
            useDemoBypass: true,
            licenseDocumentUrl: null,
          }),
        ),
      }),
    );

    expect(response.status).toBe(200);
    expect(supabase.__mocks.profileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        license_status: "VERIFIED",
      }),
    );
  });

  it("fallback uses development default verify_valid when mode missing", async () => {
    process.env.NODE_ENV = "development";
    const supabase = createSupabase();
    createRouteSupabaseMock.mockResolvedValue(supabase);

    const response = await POST(
      new Request("http://localhost/api/license/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody()),
      }),
    );
    const payload = (await response.json()) as { status: string };
    expect(response.status).toBe(200);
    expect(payload.status).toBe("VERIFIED");
  });

  it("fallback sets county to null when county is omitted", async () => {
    const supabase = createSupabase();
    createRouteSupabaseMock.mockResolvedValue(supabase);

    const response = await POST(
      new Request("http://localhost/api/license/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          requestBody({
            declaredLicenseNumber: "NARGC-77777",
            county: undefined,
          }),
        ),
      }),
    );
    const payload = (await response.json()) as {
      extractedFields: { county: string | null };
    };

    expect(response.status).toBe(200);
    expect(payload.extractedFields.county).toBeNull();
  });

  it("falls back when verification service is non-2xx", async () => {
    process.env.LICENSE_VERIFICATION_SERVICE_URL = "https://verify.example";
    process.env.LICENSE_VERIFICATION_SERVICE_TOKEN = "token-1";
    process.env.LICENSE_VERIFICATION_FALLBACK_MODE = "review";
    const supabase = createSupabase();
    createRouteSupabaseMock.mockResolvedValue(supabase);
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("http://localhost/api/license/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody()),
      }),
    );
    const payload = (await response.json()) as { status: string };

    expect(response.status).toBe(200);
    expect(payload.status).toBe("NEEDS_REVIEW");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://verify.example/verify-license",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token-1",
        }),
      }),
    );
  });

  it("accepts service payload and normalizes unknown status to needs review", async () => {
    process.env.LICENSE_VERIFICATION_SERVICE_URL = "https://verify.example";
    const supabase = createSupabase();
    createRouteSupabaseMock.mockResolvedValue(supabase);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          status: "UNKNOWN",
          extracted_fields: {
            license_number: "IE-123456",
            expiry_date: "not-a-date",
          },
        }),
      }),
    );

    const response = await POST(
      new Request("http://localhost/api/license/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody()),
      }),
    );
    const payload = (await response.json()) as {
      status: string;
      reasons: string[];
      extractedFields: { county: string | null };
    };

    expect(response.status).toBe(200);
    expect(payload.status).toBe("NEEDS_REVIEW");
    expect(payload.reasons).toEqual([]);
    expect(payload.extractedFields.county).toBe("Westmeath");
    expect(supabase.__mocks.profileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        license_expiry_date: null,
      }),
    );
  });

  it("accepts recognized service status and parses valid expiry", async () => {
    process.env.LICENSE_VERIFICATION_SERVICE_URL = "https://verify.example";
    const supabase = createSupabase();
    createRouteSupabaseMock.mockResolvedValue(supabase);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          status: "VERIFIED",
          confidence_score: 0.91,
          extracted_fields: {
            license_number: "NARGC-202020",
            holder_name: "Jane Hunter",
            expiry_date: "2030-12-31T00:00:00.000Z",
            license_type: "GAME",
            county: "Meath",
          },
          reasons: ["Validated externally."],
        }),
      }),
    );

    const response = await POST(
      new Request("http://localhost/api/license/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody({ declaredLicenseNumber: null })),
      }),
    );
    const payload = (await response.json()) as {
      status: string;
      extractedFields: { expiry_date: string | null };
      reasons: string[];
    };

    expect(response.status).toBe(200);
    expect(payload.status).toBe("VERIFIED");
    expect(payload.extractedFields.expiry_date).toBe("2030-12-31T00:00:00.000Z");
    expect(payload.reasons).toEqual(["Validated externally."]);
    expect(supabase.__mocks.profileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        license_expiry_date: "2030-12-31",
        license_number: "NARGC-202020",
      }),
    );
  });

  it("handles service payload with missing extracted fields and omitted input fields", async () => {
    process.env.LICENSE_VERIFICATION_SERVICE_URL = "https://verify.example";
    const supabase = createSupabase();
    createRouteSupabaseMock.mockResolvedValue(supabase);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          status: "REJECTED",
        }),
      }),
    );

    const response = await POST(
      new Request("http://localhost/api/license/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          requestBody({
            declaredLicenseNumber: undefined,
            county: undefined,
          }),
        ),
      }),
    );
    const payload = (await response.json()) as {
      status: string;
      extractedFields: {
        license_number: string | null;
        expiry_date: string | null;
        county: string | null;
      };
      reasons: string[];
    };

    expect(response.status).toBe(200);
    expect(payload.status).toBe("REJECTED");
    expect(payload.extractedFields.license_number).toBeNull();
    expect(payload.extractedFields.expiry_date).toBeNull();
    expect(payload.extractedFields.county).toBeNull();
    expect(payload.reasons).toEqual([]);
    expect(supabase.__mocks.profileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        license_number: null,
      }),
    );
  });

  it("stores null license number when both extracted and declared numbers are empty", async () => {
    const supabase = createSupabase();
    createRouteSupabaseMock.mockResolvedValue(supabase);

    const response = await POST(
      new Request("http://localhost/api/license/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody({ declaredLicenseNumber: null })),
      }),
    );

    expect(response.status).toBe(200);
    expect(supabase.__mocks.profileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        license_number: null,
      }),
    );
  });

  it("returns 500 when profile update fails", async () => {
    process.env.LICENSE_VERIFICATION_FALLBACK_MODE = "verify_valid";
    createRouteSupabaseMock.mockResolvedValue(
      createSupabase({ profileError: { message: "db fail" } }),
    );

    const response = await POST(
      new Request("http://localhost/api/license/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody()),
      }),
    );

    expect(response.status).toBe(500);
  });
});
