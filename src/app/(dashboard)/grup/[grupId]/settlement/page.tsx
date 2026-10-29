"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useGrupDetail } from "@/hooks/useGrup";
import { useDaftarPengeluaran } from "@/hooks/usePengeluaran";
import { useSaldoGrup, useRealtimeSaldo } from "@/hooks/useRealtimeSaldo";
import { useDaftarPelunasan, useTandaiLunas } from "@/hooks/useSettlement";
import RekapSaldo from "@/components/settlement/RekapSaldo";
import { SettlementErrorBoundary } from "@/components/settlement/SettlementErrorBoundary";
import { hitungSettlementGrup } from "@/utils/konversiSaldoToInput";
import {
  ArrowLeft,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  History,
  Loader2,
  Check,
  Radio,
} from "lucide-react";

interface SettlementPageProps {
  params: Promise<{ grupId: string }>;
}

export default function SettlementPage({ params }: SettlementPageProps) {
  const { grupId } = use(params);

  // Active Realtime updates
  useRealtimeSaldo(grupId);

  const {
    data: grup,
    isLoading: loadingGrup,
    isError: loadingGrupError,
    error: grupError,
  } = useGrupDetail(grupId);
  const {
    data: daftarSaldo,
    isLoading: loadingSaldo,
    isError: loadingSaldoError,
    error: saldoError,
  } = useSaldoGrup(grupId);
  const {
    data: daftarPengeluaran,
    isLoading: loadingPengeluaran,
    isError: loadingPengeluaranError,
    error: pengeluaranError,
  } = useDaftarPengeluaran(grupId);
  const { data: riwayatPelunasan, isLoading: loadingPelunasan } =
    useDaftarPelunasan(grupId);

  const tandaiLunas = useTandaiLunas();

  const isLoading =
    loadingGrup || loadingSaldo || loadingPelunasan || loadingPengeluaran;

  // Map anggota ID ke nama tampilan
  const anggotaMap = useMemo(() => {
    const map = new Map<string, string>();
    grup?.anggota?.forEach((a) => {
      map.set(a.id, a.nama_tampilan);
    });
    return map;
  }, [grup]);

  // Hitung transaksi settlement minimum
  const transaksiSettlement = useMemo(() => {
    if (!daftarSaldo) return [];
    return hitungSettlementGrup(daftarSaldo);
  }, [daftarSaldo]);

  const handleLunas = async (dariId: string, keId: string, jumlah: number) => {
    try {
      await tandaiLunas.mutateAsync({
        grupId,
        dariAnggotaId: dariId,
        keAnggotaId: keId,
        jumlah,
      });
    } catch (err) {
      console.error("Gagal menandai lunas:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadingGrupError || loadingSaldoError || loadingPengeluaranError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
          <h2 className="text-lg font-bold text-destructive">
            Terjadi kesalahan saat memuat data settlement.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {grupError?.message ||
              saldoError?.message ||
              pengeluaranError?.message ||
              "Silakan muat ulang halaman."}
          </p>
        </div>
      </div>
    );
  }

  if (!grup) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-sm font-medium text-destructive">
          Grup tidak ditemukan
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
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-8">
      {/* Tombol kembali */}
      <Link
        href={`/grup/${grupId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke {grup.nama}
      </Link>

      {/* Header Halaman Settlement */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Penyelesaian Utang (Settlement)
            </h1>
            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Sistem otomatis menyederhanakan transaksi ke jumlah minimum
            (maksimal n &minus; 1 transaksi untuk n anggota)
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
          <Radio className="h-3 w-3 animate-pulse text-emerald-500" />
          <span>Real-time Sync</span>
        </div>
      </div>

      {/* Kartu Hasil Rekomendasi Settlement */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-foreground">
          Rekomendasi Transaksi Pembayaran
        </h2>

        {transaksiSettlement.length === 0 ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center space-y-2">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
            <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
              Seluruh Utang Sudah Lunas &amp; Impas!
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 max-w-sm mx-auto">
              Tidak ada tagihan atau piutang yang perlu dibayar antar anggota
              grup saat ini.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transaksiSettlement.map((item, idx) => {
              const dariNama = anggotaMap.get(item.dariAnggotaId) || "Debitur";
              const keNama = anggotaMap.get(item.keAnggotaId) || "Kreditur";

              return (
                <div
                  key={`${item.dariAnggotaId}-${item.keAnggotaId}-${idx}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-background hover:border-primary/40 transition shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                      <span className="rounded-lg bg-rose-500/10 px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400">
                        {dariNama}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-600 dark:text-emerald-400">
                        {keNama}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-border/60 pt-2 sm:pt-0">
                    <span className="text-base font-extrabold text-foreground">
                      Rp {item.jumlah.toLocaleString("id-ID")}
                    </span>

                    <button
                      type="button"
                      disabled={tandaiLunas.isPending}
                      onClick={() =>
                        handleLunas(
                          item.dariAnggotaId,
                          item.keAnggotaId,
                          item.jumlah,
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow hover:opacity-90 active:opacity-80 disabled:opacity-50 transition"
                    >
                      {tandaiLunas.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Tandai Lunas
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rekap Saldo & Histori Pengeluaran */}
      <SettlementErrorBoundary>
        <RekapSaldo
          grupNama={grup.nama}
          daftarSaldo={daftarSaldo ?? []}
          daftarPengeluaran={daftarPengeluaran}
          isLoading={loadingSaldo || loadingPengeluaran}
          error={saldoError || pengeluaranError || null}
        />
      </SettlementErrorBoundary>

      {/* Bagian Riwayat Pelunasan */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h2 className="text-base font-bold text-foreground">
            Riwayat Pelunasan ({riwayatPelunasan?.length || 0})
          </h2>
        </div>

        {!riwayatPelunasan || riwayatPelunasan.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Belum ada riwayat pelunasan tercatat.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {riwayatPelunasan.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {tx.dari_anggota?.nama_tampilan || "Anggota"}
                  </span>
                  <span className="text-muted-foreground">melunasi ke</span>
                  <span className="font-semibold text-foreground">
                    {tx.ke_anggota?.nama_tampilan || "Anggota"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Rp {tx.jumlah.toLocaleString("id-ID")}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3 w-3" />
                    Lunas
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
