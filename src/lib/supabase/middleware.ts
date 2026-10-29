import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * updateSession — dipanggil dari src/proxy.ts.
 *
 * Fungsi ini membuat server client di konteks proxy agar Supabase
 * bisa membaca cookie dari request DAN menuliskan token yang di-refresh
 * kembali ke response. Tanpa ini, session akan kadaluarsa diam-diam.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Tulis cookie ke request agar Server Components yang menerima
          // request ini bisa membaca nilai baru.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // Buat ulang response dengan request yang sudah diperbarui,
          // lalu tulis juga cookie ke response agar browser menyimpannya.
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // PENTING: getUser() (bukan getSession()) dipakai karena ia mem-validasi
  // JWT ke Supabase Auth setiap kali, bukan hanya membaca cookie lokal.
  // Ini mencegah user memalsukan sesi dengan memanipulasi cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}
