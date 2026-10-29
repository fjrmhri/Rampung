"use client";

import Link from "next/link";
import { useDaftarGrup } from "@/hooks/useGrup";
import { Plus, UserPlus, Users, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { IconTile } from "@/components/ui/IconTile";
import { Skeleton } from "@/components/ui/Skeleton";

const gridKartu =
  "grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4";

export default function DashboardPage() {
  const { data: daftarGrup, isLoading, isError, error } = useDaftarGrup();

  return (
    <div className="flex flex-col gap-8">
      {/* Header & Main Actions */}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="text-[clamp(26px,3vw,32px)] leading-[1.15] font-extrabold tracking-[-0.025em]">
            Daftar Grup
          </h1>
          <p className="text-[15px] text-muted-foreground">
            Kelola pengeluaran bersama dan pantau penyelesaian utang
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/grup/gabung"
            className={buttonVariants({ variant: "secondary" })}
          >
            <UserPlus aria-hidden="true" className="size-4" />
            Gabung Grup
          </Link>
          <Link href="/grup/baru" className={buttonVariants()}>
            <Plus aria-hidden="true" className="size-4" />
            Buat Grup
          </Link>
        </div>
      </div>

      {/* State Loading */}
      {isLoading && (
        <div aria-busy="true" className={gridKartu}>
          <span className="sr-only">Memuat daftar grup</span>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex h-[148px] flex-col gap-3 rounded-xl border border-border bg-card p-5"
            >
              <Skeleton className="h-[18px] w-3/5" />
              <Skeleton className="h-3 w-[35%]" />
              <Skeleton className="mt-auto h-3 w-4/5" />
            </div>
          ))}
        </div>
      )}

      {/* State Error */}
      {isError && (
        <Alert size="lg">Gagal memuat daftar grup: {error.message}</Alert>
      )}

      {/* State Kosong (Empty State) */}
      {!isLoading && !isError && daftarGrup?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border-[1.5px] border-dashed border-input bg-card px-6 py-[clamp(32px,6vw,56px)] text-center">
          <IconTile icon={Users} size="lg" />
          <h2 className="text-[19px] font-extrabold">Belum Memiliki Grup</h2>
          <p className="max-w-[400px] text-sm text-pretty text-muted-foreground">
            Buat grup baru untuk mulai membagi pengeluaran atau bergabung dengan
            grup teman Anda via kode undangan.
          </p>

          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <Link href="/grup/baru" className={buttonVariants()}>
              <Plus aria-hidden="true" className="size-4" />
              Buat Grup Sekarang
            </Link>
            <Link
              href="/grup/gabung"
              className={buttonVariants({ variant: "secondary" })}
            >
              <UserPlus aria-hidden="true" className="size-4" />
              Masukkan Kode
            </Link>
          </div>
        </div>
      )}

      {/* Grid Daftar Grup */}
      {!isLoading && !isError && (daftarGrup?.length ?? 0) > 0 && (
        <div className={gridKartu}>
          {daftarGrup?.map((grup) => (
            <Link
              key={grup.id}
              href={`/grup/${grup.id}`}
              className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-xs transition-[border-color,box-shadow,translate] duration-150 ease-out hover:-translate-y-px hover:border-primary/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <h2 className="truncate text-[17px] font-extrabold tracking-[-0.01em]">
                    {grup.nama}
                  </h2>
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <Users aria-hidden="true" className="size-3.5" />
                    {grup.jumlah_anggota} anggota
                  </span>
                </div>
                <ChevronRight
                  aria-hidden="true"
                  className="size-[18px] shrink-0 text-muted-foreground transition-colors duration-150 group-hover:text-primary"
                />
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-muted pt-3.5 text-[13px] text-muted-foreground">
                <span>
                  Kode:{" "}
                  <strong className="font-mono font-semibold text-foreground">
                    {grup.kode_undangan}
                  </strong>
                </span>
                <span>
                  {new Date(grup.dibuat_pada).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
