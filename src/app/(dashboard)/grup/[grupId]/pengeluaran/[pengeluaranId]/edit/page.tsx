"use client";

import { use } from "react";
import Link from "next/link";
import { useGrupDetail } from "@/hooks/useGrup";
import { usePengeluaranDetail } from "@/hooks/usePengeluaran";
import { FormPengeluaran } from "@/components/pengeluaran/FormPengeluaran";
import { ArrowLeft, Loader2, Edit3 } from "lucide-react";

interface EditPengeluaranPageProps {
  params: Promise<{ grupId: string; pengeluaranId: string }>;
}

export default function EditPengeluaranPage({
  params,
}: EditPengeluaranPageProps) {
  const { grupId, pengeluaranId } = use(params);
  const { data: grup, isLoading: loadingGrup } = useGrupDetail(grupId);
  const {
    data: pengeluaran,
    isLoading: loadingPengeluaran,
    isError,
    error,
  } = usePengeluaranDetail(pengeluaranId);

  const isLoading = loadingGrup || loadingPengeluaran;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !grup || !pengeluaran) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-sm font-medium text-destructive">
          {error?.message || "Pengeluaran tidak ditemukan"}
        </p>
        <Link
          href={`/grup/${grupId}`}
          className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Grup
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/grup/${grupId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Grup {grup.nama}
      </Link>

      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Edit3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Edit Pengeluaran</h1>
            <p className="text-xs text-muted-foreground">
              Versi saat ini: <span className="font-mono font-bold text-foreground">v{pengeluaran.versi}</span>
            </p>
          </div>
        </div>
      </div>

      <FormPengeluaran
        grupId={grupId}
        anggotaList={grup.anggota}
        pengeluaranToEdit={pengeluaran}
      />
    </div>
  );
}
