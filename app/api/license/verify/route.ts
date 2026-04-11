import { NextResponse } from "next/server";
import { z } from "zod";
import { sendPushToUser } from "@/lib/push/server";
import { createRouteSupabase } from "@/lib/supabase/server";

const bodySchema = z
  .object({
    hunterId: z.string().uuid(),
    licenseDocumentUrl: z.string().url().nullable().optional(),
    declaredLicenseNumber: z.string().nullable().optional(),
    county: z.string().nullable().optional(),
    useDemoBypass: z.boolean().optional().default(false),
  })
  .superRefine((value, ctx) => {
    if (!value.useDemoBypass && !value.licenseDocumentUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["licenseDocumentUrl"],
        message: "A license document URL is required unless demo bypass is enabled.",
      });
    }
  });

type VerificationStatus = "VERIFIED" | "REJECTED" | "NEEDS_REVIEW";

function parseIsoDate(input?: string | null) {
  if (!input) return null;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function isDemoBypassAllowed() {
  const configured = process.env.LICENSE_VERIFICATION_ALLOW_DEMO_BYPASS;
  if (configured === "true") return true;
  if (configured === "false") return false;
  return process.env.NODE_ENV === "development";
}

function fallbackDecision(input: z.infer<typeof bodySchema>) {
  const normalized = (input.declaredLicenseNumber ?? "").trim().toUpperCase();
  const numberLooksValid = /^[A-Z0-9][A-Z0-9\-\/]{5,20}$/.test(normalized);
  const fallbackMode =
    process.env.LICENSE_VERIFICATION_FALLBACK_MODE ??
    (process.env.NODE_ENV === "development" ? "verify_valid" : "review");
  const status: VerificationStatus =
    numberLooksValid && fallbackMode === "verify_valid"
      ? "VERIFIED"
      : numberLooksValid
        ? "NEEDS_REVIEW"
        : "REJECTED";
  return {
    status,
    confidenceScore: status === "VERIFIED" ? 0.65 : numberLooksValid ? 0.45 : 0.2,
    extractedFields: {
      license_number: normalized || null,
      holder_name: null,
      expiry_date: null,
      license_type: null,
      county: input.county ?? null,
    },
    reasons:
      status === "VERIFIED"
        ? ["Fallback verification mode accepted a format-valid license number."]
        : status === "REJECTED"
          ? ["Unable to validate declared license number format."]
          : ["Automated review not configured. Marked for manual review."],
    rawResponse: {
      provider: "fallback",
      note: "No external verification service configured.",
      mode: fallbackMode,
    },
  };
}

function demoBypassDecision(input: z.infer<typeof bodySchema>) {
  const normalized = (input.declaredLicenseNumber ?? "").trim().toUpperCase();
  const oneYearAhead = new Date();
  oneYearAhead.setFullYear(oneYearAhead.getFullYear() + 1);
  return {
    status: "VERIFIED" as const,
    confidenceScore: 0.99,
    extractedFields: {
      license_number: normalized || "DEMO-HUNT-0001",
      holder_name: "Demo Hunter",
      expiry_date: oneYearAhead.toISOString().slice(0, 10),
      license_type: "GAME",
      county: input.county ?? "Westmeath",
    },
    reasons: [
      "Demo bypass enabled for local testing.",
      "Do not use in production.",
    ],
    rawResponse: {
      provider: "demo-bypass",
      note: "Verification was bypassed in development mode.",
    },
  };
}

async function callVerificationService(input: z.infer<typeof bodySchema>) {
  const endpoint = process.env.LICENSE_VERIFICATION_SERVICE_URL;
  if (!endpoint) return fallbackDecision(input);

  const token = process.env.LICENSE_VERIFICATION_SERVICE_TOKEN;
  const response = await fetch(`${endpoint.replace(/\/+$/, "")}/verify-license`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      hunter_id: input.hunterId,
      license_image_url: input.licenseDocumentUrl,
      declared_license_number: input.declaredLicenseNumber ?? null,
      county: input.county ?? null,
    }),
  });

  if (!response.ok) {
    return fallbackDecision(input);
  }

  const payload = (await response.json()) as {
    status?: VerificationStatus;
    confidence_score?: number;
    extracted_fields?: {
      license_number?: string | null;
      holder_name?: string | null;
      expiry_date?: string | null;
      license_type?: string | null;
      county?: string | null;
    };
    reasons?: string[];
  };
  const status =
    payload.status === "VERIFIED" ||
    payload.status === "REJECTED" ||
    payload.status === "NEEDS_REVIEW"
      ? payload.status
      : "NEEDS_REVIEW";

  return {
    status,
    confidenceScore: payload.confidence_score ?? 0.5,
    extractedFields: {
      license_number: payload.extracted_fields?.license_number ?? null,
      holder_name: payload.extracted_fields?.holder_name ?? null,
      expiry_date: payload.extracted_fields?.expiry_date ?? null,
      license_type: payload.extracted_fields?.license_type ?? null,
      county: payload.extracted_fields?.county ?? input.county ?? null,
    },
    reasons: payload.reasons ?? [],
    rawResponse: payload,
  };
}

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = await createRouteSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (user.id !== parsed.data.hunterId) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (parsed.data.useDemoBypass && !isDemoBypassAllowed()) {
    return NextResponse.json(
      { error: "Demo bypass is not allowed in this environment." },
      { status: 403 },
    );
  }

  const decision = parsed.data.useDemoBypass
    ? demoBypassDecision(parsed.data)
    : await callVerificationService(parsed.data);
  const expiryDate = parseIsoDate(decision.extractedFields.expiry_date);

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      license_status: decision.status,
      license_verified: decision.status === "VERIFIED",
      license_verified_at:
        decision.status === "VERIFIED" ? new Date().toISOString() : null,
      license_expiry_date: expiryDate,
      license_number:
        decision.extractedFields.license_number ??
        parsed.data.declaredLicenseNumber ??
        null,
    })
    .eq("id", parsed.data.hunterId);
  if (profileError) {
    return NextResponse.json(
      { error: "Unable to update profile verification state." },
      { status: 500 },
    );
  }

  await supabase.from("hunter_license_verifications").insert({
    hunter_id: parsed.data.hunterId,
    license_document_url: parsed.data.licenseDocumentUrl ?? null,
    extracted_license_number: decision.extractedFields.license_number,
    extracted_holder_name: decision.extractedFields.holder_name,
    extracted_license_type: decision.extractedFields.license_type,
    extracted_county: decision.extractedFields.county,
    extracted_expiry_date: expiryDate,
    confidence_score: decision.confidenceScore,
    status: decision.status,
    reasons: decision.reasons,
    raw_response: decision.rawResponse,
  });

  await sendPushToUser(parsed.data.hunterId, {
    title: "License verification updated",
    body: `Your hunting license status is now ${decision.status}.`,
    url: "/profile",
    tag: `license-${decision.status.toLowerCase()}`,
  });

  return NextResponse.json({
    status: decision.status,
    confidenceScore: decision.confidenceScore,
    extractedFields: decision.extractedFields,
    reasons: decision.reasons,
  });
}
