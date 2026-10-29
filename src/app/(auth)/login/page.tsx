import { kirimOtp } from "./actions";
import { decodeAman } from "@/utils/decodeAman";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";

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
    <div className="grid flex-1 place-items-center px-4 py-12">
      <div className="w-full max-w-[400px]">
        {/* Logo / Wordmark */}
        <div className="mb-8 flex flex-col items-center gap-2.5 text-center">
          <span aria-hidden="true" className="size-4 rounded-[4px] bg-primary" />
          <h1 className="text-[32px] leading-[1.1] font-extrabold tracking-[-0.03em]">
            Rampung
          </h1>
          <p className="text-[15px] text-muted-foreground">
            Masuk atau daftar — cukup dengan email
          </p>
        </div>

        <Card className="flex flex-col gap-5 p-7 shadow-card">
          {error && <Alert>{decodeAman(error)}</Alert>}

          <form action={kirimOtp} className="flex flex-col gap-5">
            {/* Simpan tujuan redirect agar bisa di-forward setelah OTP */}
            {next && <input type="hidden" name="next" value={next} />}

            <Field label="Alamat Email" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="nama@contoh.com"
              />
            </Field>

            <SubmitButton
              id="btn-kirim-otp"
              size="lg"
              fullWidth
              pendingText="Mengirim..."
            >
              Kirim Link Masuk
            </SubmitButton>
          </form>
        </Card>

        <p className="mt-6 text-center text-[13px] leading-[1.6] text-pretty text-muted-foreground">
          Kami akan mengirim tautan masuk ke email Anda. Buka tautan itu untuk
          masuk, dan akun akan dibuat otomatis jika belum terdaftar.
        </p>
      </div>
    </div>
  );
}
