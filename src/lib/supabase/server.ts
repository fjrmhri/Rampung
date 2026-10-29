import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server client — gunakan di Server Components, Server Actions, dan Route Handlers.
 * Dibuat fresh per-request; JANGAN di-cache di module scope.
 *
 * Catatan Next.js 15+: `cookies()` adalah async, wajib di-await.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll dipanggil dari Server Component — tidak bisa set cookie.
            // Proxy (src/proxy.ts) yang mengurus refresh; error ini aman diabaikan.
          }
        },
      },
    },
  );
}
