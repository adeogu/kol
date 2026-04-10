import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const nextPath = requestUrl.searchParams.get("next");
  const origin = requestUrl.origin;
  const safeNextPath =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : null;
  const defaultNextPath = type === "recovery" ? "/reset-password" : "/onboarding";

  if (!code && !(tokenHash && type === "recovery")) {
    return NextResponse.redirect(new URL("/login?message=confirm-error", origin));
  }

  try {
    const supabase = await createRouteSupabase();
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(
          new URL("/login?message=confirm-error", origin),
        );
      }
    } else {
      const { error } = await supabase.auth.verifyOtp({
        type: "recovery",
        token_hash: tokenHash as string,
      });
      if (error) {
        return NextResponse.redirect(
          new URL("/forgot-password?message=reset-error", origin),
        );
      }
    }
  } catch {
    if (type === "recovery") {
      return NextResponse.redirect(
        new URL("/forgot-password?message=reset-error", origin),
      );
    }
    return NextResponse.redirect(new URL("/login?message=confirm-error", origin));
  }

  return NextResponse.redirect(new URL(safeNextPath ?? defaultNextPath, origin));
}

