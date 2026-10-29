"use client";

import { use } from "react";
import Link from "next/link";
import { useGrupDetail } from "@/hooks/useGrup";
import { FormPengeluaran } from "@/components/pengeluaran/FormPengeluaran";
import { ArrowLeft, CirclePlus } from "lucide-react";
import { BackLink } from "@/components/ui/BackLink";
import { buttonVariants } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/IconTile";
import { Spinner } from "@/components/ui/Spinner";

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
      <div className="flex min-h-[60vh] items-center justify-center text-primary">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (isError || !grup) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-12 text-center">
        <p className="text-sm font-semibold text-destructive-fg-soft">
          {error?.message || "Grup tidak ditemukan"}
        </p>
        <Link href="/dashboard" className={buttonVariants({ variant: "text" })}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-5">
      <BackLink href={`/grup/${grupId}`}>{`Kembali ke Grup ${grup.nama}`}</BackLink>

      <div className="flex items-center gap-3.5">
        <IconTile icon={CirclePlus} size="md" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="text-[clamp(22px,2.6vw,28px)] font-extrabold tracking-[-0.02em]">
            Catat Pengeluaran Baru
          </h1>
          <p className="text-sm text-muted-foreground">
            Grup: <span className="font-bold text-foreground">{grup.nama}</span>
          </p>
        </div>
      </div>

      <FormPengeluaran grupId={grupId} anggotaList={grup.anggota} />
    </div>
  );
}
