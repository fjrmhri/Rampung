"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useGabungGrup } from "@/hooks/useGrup";
import { ArrowLeft, UserPlus, Loader2, KeyRound } from "lucide-react";

function FormGabungGrup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [kode, setKode] = useState("");
  const [nama, setNama] = useState("");
  const gabungGrup = useGabungGrup();

  useEffect(() => {
    const kodeParam = searchParams.get("kode");
    if (kodeParam) {
      setKode(kodeParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kode.trim()) return;

    try {
      const targetGrupId = await gabungGrup.mutateAsync({
        kode: kode.trim(),
        nama: nama.trim() || undefined,
      });
      router.push(`/grup/${targetGrupId}`);
    } catch (err) {
      console.error("Gagal bergabung ke grup:", err);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UserPlus className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Gabung Grup</h1>
          <p className="text-xs text-muted-foreground">
            Masukkan kode undangan dari admin grup untuk bergabung
          </p>
        </div>
      </div>

      {gabungGrup.isError && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {gabungGrup.error.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label
            htmlFor="kode"
            className="block text-sm font-medium text-foreground"
          >
            Kode Undangan <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              id="kode"
              type="text"
              required
              value={kode}
              onChange={(e) => setKode(e.target.value)}
              placeholder="Contoh: a1b2c3d4"
              className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-sm font-mono text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="nama"
            className="block text-sm font-medium text-foreground"
          >
            Nama Tampilan di Grup <span className="text-xs font-normal text-muted-foreground">(Opsional)</span>
          </label>
          <input
            id="nama"
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Kosongkan untuk menggunakan email akun Anda"
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
          />
        </div>

        <button
          id="btn-submit-gabung-grup"
          type="submit"
          disabled={gabungGrup.isPending || !kode.trim()}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:opacity-90 active:opacity-80 disabled:opacity-50 transition"
        >
          {gabungGrup.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Memproses...
            </>
          ) : (
            "Gabung ke Grup"
          )}
        </button>
      </form>
    </div>
  );
}

export default function GabungGrupPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:py-12">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Dashboard
      </Link>

      <Suspense fallback={
        <div className="flex justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }>
        <FormGabungGrup />
      </Suspense>
    </div>
  );
}
