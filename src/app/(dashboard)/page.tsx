"use client";

import Link from "next/link";
import { useDaftarGrup } from "@/hooks/useGrup";
import { Plus, UserPlus, Users, ChevronRight, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { data: daftarGrup, isLoading, isError, error } = useDaftarGrup();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Daftar Grup
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola pengeluaran bersama dan pantau penyelesaian utang
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/grup/gabung"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            Gabung Grup
          </Link>
          <Link
            href="/grup/baru"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition shadow"
          >
            <Plus className="h-4 w-4" />
            Buat Grup
          </Link>
        </div>
      </div>

      {/* State Loading */}
      {isLoading && (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* State Error */}
      {isError && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-medium text-destructive">
            Gagal memuat daftar grup: {error.message}
          </p>
        </div>
      )}

      {/* State Kosong (Empty State) */}
      {!isLoading && !isError && daftarGrup?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <Users className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Belum Memiliki Grup</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
            Buat grup baru untuk mulai membagi pengeluaran atau bergabung dengan grup teman Anda via kode undangan.
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/grup/baru"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 shadow"
            >
              <Plus className="h-4 w-4" />
              Buat Grup Sekarang
            </Link>
            <Link
              href="/grup/gabung"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              <UserPlus className="h-4 w-4" />
              Masukkan Kode
            </Link>
          </div>
        </div>
      )}

      {/* Grid Daftar Grup */}
      {!isLoading && !isError && (daftarGrup?.length ?? 0) > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {daftarGrup?.map((grup) => (
            <Link
              key={grup.id}
              href={`/grup/${grup.id}`}
              className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h2 className="font-bold text-foreground group-hover:text-primary transition line-clamp-1">
                    {grup.nama}
                  </h2>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition shrink-0 mt-0.5" />
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span>{grup.jumlah_anggota} anggota</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/60 text-[11px] text-muted-foreground">
                <span>Kode: <strong className="font-mono text-foreground">{grup.kode_undangan}</strong></span>
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
