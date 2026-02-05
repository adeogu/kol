import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const supabase = await createRouteSupabase();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", origin));
}

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const supabase = await createRouteSupabase();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", origin));
}
