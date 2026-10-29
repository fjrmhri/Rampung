import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

/**
 * Next.js 16 Proxy (sebelumnya: middleware).
 * Dijalankan sebelum setiap request — menangani refresh sesi Supabase
 * dan proteksi route dashboard.
 */
export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Semua route di bawah /dashboard/* wajib autentikasi
  const isDashboardRoute = pathname.startsWith("/dashboard");

  // Route auth tidak boleh diakses user yang sudah login
  const isAuthRoute = pathname.startsWith("/login");

  if (isDashboardRoute && !user) {
    // Belum login → redirect ke /login dengan next param agar bisa balik
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && user) {
    // Sudah login → redirect ke dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Kembalikan response Supabase (yang sudah meng-handle cookie refresh)
  return supabaseResponse;
}
