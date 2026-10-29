"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getSafeNextPath(value?: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value, "http://example.com");

    if (url.origin !== "http://example.com") {
      return null;
    }

    if (!url.pathname.startsWith("/")) {
      return null;
    }

    return url.pathname + (url.search ?? "");
  } catch {
    return null;
  }
}

function buildLoginUrl(email: string, errorMessage?: string, next?: string) {
  const params = new URLSearchParams({ email, ...(next ? { next } : {}) });
  if (errorMessage) {
    params.set("error", errorMessage);
  }
  return `/login/verifikasi?${params.toString()}`;
}

/**
 * Kirim magic link ke email.
 * Supabase akan mengirim email berisi tautan untuk masuk atau mengonfirmasi akun.
 */
export async function kirimOtp(formData: FormData) {
  const supabase = await createClient();
  const email = (formData.get("email") as string).trim().toLowerCase();
  const next = getSafeNextPath(formData.get("next") as string | null);

  if (!email) {
    const query = new URLSearchParams({ error: "Email+wajib+diisi" });
    if (next) query.set("next", next);
    return redirect(`/login?${query.toString()}`);
  }

  // Utamakan NEXT_PUBLIC_SITE_URL agar tautan email tidak bergantung pada header Host
  let origin = process.env.NEXT_PUBLIC_SITE_URL;
  if (!origin) {
    const headersList = await headers();
    const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
    const protocol = headersList.get("x-forwarded-proto") ?? "http";
    origin = host ? `${protocol}://${host}` : "http://localhost:3000";
  }
  const callbackUrl = new URL("/auth/callback", origin);

  if (next) {
    callbackUrl.searchParams.set("next", next);
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: callbackUrl.toString(),
    },
  });

  if (error) {
    console.error("[auth/kirimOtp]", error.message);
    const query = new URLSearchParams({
      error: encodeURIComponent(error.message),
    });
    if (next) query.set("next", next);
    return redirect(`/login?${query.toString()}`);
  }

  return redirect(buildLoginUrl(email, undefined, next ?? undefined));
}

/**
 * Logout: hapus session dari cookie.
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  return redirect("/login");
}
