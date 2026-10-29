import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_REDIRECT = "/dashboard";

function getSafeNextPath(value?: string | null) {
  if (!value) {
    return DEFAULT_REDIRECT;
  }

  try {
    const url = new URL(value, "http://example.com");
    if (url.origin !== "http://example.com" || !url.pathname.startsWith("/")) {
      return DEFAULT_REDIRECT;
    }
    return url.pathname + (url.search ?? "");
  } catch {
    return DEFAULT_REDIRECT;
  }
}

/**
 * Route Handler untuk callback Supabase Auth.
 *
 * Dipakai ketika user mengklik magic link di email (bukan kode OTP).
 * Supabase redirect ke /auth/callback?code=XXX, lalu kita tukar code
 * dengan session menggunakan exchangeCodeForSession().
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=Link+tidak+valid+atau+sudah+kadaluarsa", origin),
  );
}
