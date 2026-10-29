import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { logout } from "@/app/(auth)/login/actions";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

/**
 * Layout dashboard — memverifikasi sesi di sisi server sebagai
 * lapisan perlindungan kedua (proxy adalah lapisan pertama).
 *
 * Jika karena sebab apapun proxy tidak memblokir request
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
      <header className="sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur-[8px]">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-4 px-[clamp(16px,4vw,32px)]">
          <Link
            href="/dashboard"
            className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-xs text-[19px] font-extrabold tracking-[-0.02em] focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <span aria-hidden="true" className="size-3 rounded-[3px] bg-primary" />
            Rampung
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            <span
              title={user.email}
              className="mr-1 min-w-0 truncate text-sm text-muted-foreground"
            >
              {user.email}
            </span>
            <ThemeToggle />
            <form action={logout} className="shrink-0">
              <Button id="btn-logout" type="submit" variant="secondary" size="sm">
                <LogOut aria-hidden="true" className="size-3.5" />
                Keluar
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1120px] flex-1 px-[clamp(16px,4vw,32px)] pt-[clamp(24px,4vw,40px)] pb-[72px]">
        {children}
      </main>
    </div>
  );
}
