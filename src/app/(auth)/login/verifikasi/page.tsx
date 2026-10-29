import Link from "next/link";
import { Mail } from "lucide-react";
import { decodeAman } from "@/utils/decodeAman";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { IconTile } from "@/components/ui/IconTile";

interface VerifikasiPageProps {
  searchParams: Promise<{ email?: string; error?: string; next?: string }>;
}

export const metadata = {
  title: "Cek email — Rampung",
  description: "Buka tautan yang kami kirim ke email Anda untuk masuk.",
};

const linkClass =
  "rounded-xs text-primary underline underline-offset-2 transition-colors duration-150 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2";

export default async function VerifikasiPage({
  searchParams,
}: VerifikasiPageProps) {
  const { email, error } = await searchParams;

  // Jika tidak ada email, kembalikan ke halaman login
  if (!email) {
    return (
      <div className="grid flex-1 place-items-center px-4 py-12">
        <p className="text-sm text-muted-foreground">
          Email tidak ditemukan.{" "}
          <Link href="/login" className={linkClass}>
            Kembali ke login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="grid flex-1 place-items-center px-4 py-12">
      <div className="flex w-full max-w-[420px] flex-col items-center gap-6 text-center">
        <IconTile icon={Mail} size="xl" />

        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] leading-[1.15] font-extrabold tracking-[-0.02em]">
            Cek email Anda
          </h1>
          <p className="text-[15px] break-words text-muted-foreground">
            Kami telah mengirim tautan masuk ke{" "}
            <span className="font-bold text-foreground">{email}</span>
          </p>
        </div>

        {error && (
          <Alert className="w-full text-left">{decodeAman(error)}</Alert>
        )}

        <Card className="flex w-full flex-col gap-1.5 p-5 text-left text-sm text-muted-foreground">
          <p className="font-bold text-foreground">
            Buka tautan di email Anda untuk masuk.
          </p>
          <p className="text-pretty">
            Setelah Anda mengklik tautan, Anda akan diarahkan ke aplikasi secara
            otomatis. Jika email belum muncul, cek folder spam atau promo.
          </p>
        </Card>

        <p className="text-sm text-muted-foreground">
          Tidak menerima email?{" "}
          <Link href="/login" className={linkClass}>
            Kembali ke halaman login
          </Link>
        </p>
      </div>
    </div>
  );
}
