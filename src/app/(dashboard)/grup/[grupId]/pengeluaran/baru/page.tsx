"use client";

import { use } from "react";
import Link from "next/link";
import { useGrupDetail } from "@/hooks/useGrup";
import { FormPengeluaran } from "@/components/pengeluaran/FormPengeluaran";
import { ArrowLeft, Loader2, PlusCircle } from "lucide-react";

interface TambahPengeluaranPageProps {
  params: Promise<{ grupId: string }>;
}

export default function TambahPengeluaranPage({
  params,
}: TambahPengeluaranPageProps) {
  const { grupId } = use(params);
  const { data: grup, isLoading, isError, error } = useGrupDetail(grupId);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !grup) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-sm font-medium text-destructive">
          {error?.message || "Grup tidak ditemukan"}
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Tombol kembali */}
      <Link
        href={`/grup/${grupId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Grup {grup.nama}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <PlusCircle className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Catat Pengeluaran Baru</h1>
          <p className="text-xs text-muted-foreground">
            Grup: <span className="font-semibold text-foreground">{grup.nama}</span>
          </p>
        </div>
      </div>

      <FormPengeluaran grupId={grupId} anggotaList={grup.anggota} />
    </div>
  );
}
