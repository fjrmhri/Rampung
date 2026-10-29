"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useBuatGrup } from "@/hooks/useGrup";
import { ArrowLeft, Users, Loader2 } from "lucide-react";

export default function BuatGrupPage() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [namaPemilik, setNamaPemilik] = useState("");
  const buatGrup = useBuatGrup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    try {
      const newGrup = await buatGrup.mutateAsync({
        nama,
        namaPemilik: namaPemilik.trim() || undefined,
      });
      router.push(`/grup/${newGrup.id}`);
    } catch (err) {
      console.error("Gagal membuat grup:", err);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:py-12">
      {/* Tombol kembali */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Dashboard
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Buat Grup Baru
            </h1>
            <p className="text-xs text-muted-foreground">
              Mulai patungan dan kelola utang bersama teman
            </p>
          </div>
        </div>

        {buatGrup.isError && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {buatGrup.error.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label
              htmlFor="nama"
              className="block text-sm font-medium text-foreground"
            >
              Nama Grup <span className="text-destructive">*</span>
            </label>
            <input
              id="nama"
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Liburan Bali 2026, Kos Melati"
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="namaPemilik"
              className="block text-sm font-medium text-foreground"
            >
              Nama Anda di Grup{" "}
              <span className="text-xs text-muted-foreground">(Opsional)</span>
            </label>
            <input
              id="namaPemilik"
              type="text"
              value={namaPemilik}
              onChange={(e) => setNamaPemilik(e.target.value)}
              placeholder="Nama yang ingin tampil di grup (misal: Budi)"
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            💡 Sebagai pembuat grup, Anda akan otomatis terdaftar sebagai
            anggota pertama. Jika ingin tampil berbeda, isi &quot;Nama Anda di Grup&quot;.
          </p>

          <button
            id="btn-submit-buat-grup"
            type="submit"
            disabled={buatGrup.isPending || !nama.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:opacity-90 active:opacity-80 disabled:opacity-50 transition"
          >
            {buatGrup.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Membuat Grup...
              </>
            ) : (
              "Buat Grup"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
