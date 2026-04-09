import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next");
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(new URL("/login?message=confirm-error", origin));
  }

  try {
    const supabase = await createRouteSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL("/login?message=confirm-error", origin),
      );
    }
  } catch {
    return NextResponse.redirect(new URL("/login?message=confirm-error", origin));
  }

  if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
    return NextResponse.redirect(new URL(nextPath, origin));
  }

  return NextResponse.redirect(new URL("/onboarding", origin));
}

