interface VerifikasiPageProps {
  searchParams: Promise<{ email?: string; error?: string; next?: string }>;
}

export const metadata = {
  title: "Cek email — Rampung",
  description: "Buka tautan yang kami kirim ke email Anda untuk masuk.",
};

export default async function VerifikasiPage({
  searchParams,
}: VerifikasiPageProps) {
  const { email, error } = await searchParams;

  // Jika tidak ada email, kembalikan ke halaman login
  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <p className="text-muted-foreground text-sm">
          Email tidak ditemukan.{" "}
          <a href="/login" className="underline text-foreground">
            Kembali ke login
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Cek email Anda
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Kami telah mengirim tautan masuk ke{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {decodeURIComponent(error)}
          </div>
        )}

        <div className="rounded-lg border border-border/60 bg-card/60 p-4 text-sm text-muted-foreground">
          <p className="mb-2 font-medium text-foreground">
            Buka tautan di email Anda untuk masuk.
          </p>
          <p>
            Setelah Anda mengklik tautan, Anda akan diarahkan ke aplikasi secara
            otomatis. Jika email belum muncul, cek folder spam atau promo.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Tidak menerima email?{" "}
          <a href="/login" className="underline text-foreground">
            Kembali ke halaman login
          </a>
        </p>
      </div>
    </div>
  );
}
