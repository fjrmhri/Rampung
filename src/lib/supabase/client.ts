import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client — gunakan di Client Components.
 * Singleton otomatis dicache oleh @supabase/ssr saat berjalan di browser.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
