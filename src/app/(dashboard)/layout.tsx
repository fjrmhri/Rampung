import { logout } from "@/app/(auth)/login/actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Layout dashboard — memverifikasi sesi di sisi server sebagai
 * lapisan perlindungan kedua (middleware adalah lapisan pertama).
 *
 * Jika karena sebab apapun middleware tidak memblokir request
 * tanpa sesi, layout ini akan menjadi safety net.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar sederhana */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <span className="font-bold tracking-tight">Rampung</span>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">
              {user.email}
            </span>
            <form action={logout}>
              <button
                id="btn-logout"
                type="submit"
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
