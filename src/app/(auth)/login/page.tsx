import { kirimOtp } from "./actions";
import { decodeAman } from "@/utils/decodeAman";

interface LoginPageProps {
  searchParams: Promise<{ error?: string; next?: string }>;
}

export const metadata = {
  title: "Masuk — Rampung",
  description: "Masuk atau daftar ke Rampung dengan email Anda.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, next } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Wordmark */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Rampung
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Masuk atau daftar — cukup dengan email
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {decodeAman(error)}
          </div>
        )}

        {/* Form */}
        <form action={kirimOtp} className="space-y-4">
          {/* Simpan tujuan redirect agar bisa di-forward setelah OTP */}
          {next && <input type="hidden" name="next" value={next} />}

          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              Alamat Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="nama@contoh.com"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
            />
          </div>

          <button
            id="btn-kirim-otp"
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:opacity-90 active:opacity-80 transition"
          >
            Kirim Link Masuk
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Kami akan mengirim tautan masuk ke email Anda.
          <br />
          Buka tautan itu untuk masuk, dan akun akan dibuat otomatis jika belum
          terdaftar.
        </p>
      </div>
    </div>
  );
}
