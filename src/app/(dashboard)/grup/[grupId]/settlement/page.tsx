"use client";

import { use, useMemo, useState } from "react";
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
  CircleCheck,
  ArrowRight,
  Sparkles,
  History,
  Check,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRupiah } from "@/utils/format";
import { Alert } from "@/components/ui/Alert";
import { BackLink } from "@/components/ui/BackLink";
import { Badge, LiveBadge } from "@/components/ui/Badge";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Spinner } from "@/components/ui/Spinner";

interface SettlementPageProps {
  params: Promise<{ grupId: string }>;
}

interface PendingTx {
  dariId: string;
  keId: string;
  jumlah: number;
}

const kartuSettlement = "flex flex-col p-[clamp(18px,3vw,28px)] shadow-xs";

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

  // Transaksi yang menunggu konfirmasi di dialog "Tandai Lunas?"
  const [pendingTx, setPendingTx] = useState<PendingTx | null>(null);

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

  const konfirmasiLunas = async () => {
    if (!pendingTx) return;
    await handleLunas(pendingTx.dariId, pendingTx.keId, pendingTx.jumlah);
    setPendingTx(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-primary">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (loadingGrupError || loadingSaldoError || loadingPengeluaranError) {
    return (
      <div className="mx-auto max-w-[920px] py-12">
        <Alert size="lg" title="Terjadi kesalahan saat memuat data settlement.">
          <p className="mt-1 font-normal">
            {grupError?.message ||
              saldoError?.message ||
              pengeluaranError?.message ||
              "Silakan muat ulang halaman."}
          </p>
        </Alert>
      </div>
    );
  }

  if (!grup) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-12 text-center">
        <p className="text-sm font-semibold text-destructive-fg-soft">
          Grup tidak ditemukan
        </p>
        <Link href="/dashboard" className={buttonVariants({ variant: "text" })}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col gap-6">
      <BackLink href={`/grup/${grupId}`}>{`Kembali ke ${grup.nama}`}</BackLink>

      {/* Header Halaman Settlement */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[clamp(24px,3vw,32px)] leading-[1.15] font-extrabold tracking-[-0.025em]">
              Penyelesaian Utang (Settlement)
            </h1>
            <Sparkles
              aria-hidden="true"
              className="size-[22px] shrink-0 text-accent-strong"
            />
          </div>
          <p className="text-sm text-pretty text-muted-foreground">
            Sistem otomatis menyederhanakan transaksi ke jumlah minimum
            (maksimal n &minus; 1 transaksi untuk n anggota)
          </p>
        </div>

        <LiveBadge>Real-time Sync</LiveBadge>
      </div>

      {/* Kartu Hasil Rekomendasi Settlement */}
      <Card
        as="section"
        aria-labelledby="judul-rekomendasi"
        className={cn(kartuSettlement, "gap-4")}
      >
        <h2
          id="judul-rekomendasi"
          className="text-lg font-extrabold tracking-[-0.01em]"
        >
          Rekomendasi Transaksi Pembayaran
        </h2>

        {transaksiSettlement.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-positive-border bg-positive-soft px-5 py-8 text-center text-positive">
            <CircleCheck aria-hidden="true" className="size-10" />
            <h3 className="text-lg font-extrabold">
              Seluruh Utang Sudah Lunas &amp; Impas!
            </h3>
            <p className="max-w-[380px] text-sm text-pretty">
              Tidak ada tagihan atau piutang yang perlu dibayar antar anggota
              grup saat ini.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {transaksiSettlement.map((item, idx) => {
              const dariNama = anggotaMap.get(item.dariAnggotaId) || "Debitur";
              const keNama = anggotaMap.get(item.keAnggotaId) || "Kreditur";

              return (
                <div
                  key={`${item.dariAnggotaId}-${item.keAnggotaId}-${idx}`}
                  className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 rounded-lg border border-border bg-surface-subtle px-4 py-3.5"
                >
                  <ChipTransaksi dari={dariNama} ke={keNama} />

                  <div className="flex items-center gap-4">
                    <span className="text-lg font-extrabold whitespace-nowrap tabular-nums">
                      {formatRupiah(item.jumlah)}
                    </span>

                    <Button
                      size="sm"
                      disabled={tandaiLunas.isPending}
                      onClick={() =>
                        setPendingTx({
                          dariId: item.dariAnggotaId,
                          keId: item.keAnggotaId,
                          jumlah: item.jumlah,
                        })
                      }
                    >
                      <Check aria-hidden="true" className="size-3.5" />
                      Tandai Lunas
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

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
      <Card
        as="section"
        aria-labelledby="judul-pelunasan"
        className={cn(kartuSettlement, "gap-3")}
      >
        <CardTitle id="judul-pelunasan" icon={History}>
          Riwayat Pelunasan ({riwayatPelunasan?.length || 0})
        </CardTitle>

        {!riwayatPelunasan || riwayatPelunasan.length === 0 ? (
          <p className="py-3 text-center text-sm text-muted-foreground">
            Belum ada riwayat pelunasan tercatat.
          </p>
        ) : (
          <ul className="flex flex-col">
            {riwayatPelunasan.map((tx) => (
              <li
                key={tx.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-muted py-3 text-sm"
              >
                <p>
                  <strong className="font-bold">
                    {tx.dari_anggota?.nama_tampilan || "Anggota"}
                  </strong>{" "}
                  <span className="text-muted-foreground">melunasi ke</span>{" "}
                  <strong className="font-bold">
                    {tx.ke_anggota?.nama_tampilan || "Anggota"}
                  </strong>
                </p>

                <div className="flex items-center gap-2.5">
                  <span className="font-extrabold text-positive tabular-nums">
                    {formatRupiah(tx.jumlah)}
                  </span>
                  <Badge variant="positive" shape="pill">
                    <Check aria-hidden="true" className="size-3" />
                    Lunas
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Konfirmasi Tandai Lunas */}
      <Dialog
        open={pendingTx !== null}
        onClose={() => {
          if (!tandaiLunas.isPending) setPendingTx(null);
        }}
        title="Tandai Lunas?"
        icon={CircleCheck}
        tone="positive"
        description="Pastikan pembayaran ini sudah benar-benar dilakukan. Setelah ditandai, saldo kedua anggota langsung diperbarui dan transaksi masuk ke Riwayat Pelunasan."
        actions={
          <Button loading={tandaiLunas.isPending} onClick={konfirmasiLunas}>
            Ya, Tandai Lunas
          </Button>
        }
      >
        {pendingTx && (
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-border bg-surface-subtle px-3.5 py-3">
            <ChipTransaksi
              kecil
              dari={anggotaMap.get(pendingTx.dariId) || "Debitur"}
              ke={anggotaMap.get(pendingTx.keId) || "Kreditur"}
            />
            <span className="text-[17px] font-extrabold tabular-nums">
              {formatRupiah(pendingTx.jumlah)}
            </span>
          </div>
        )}
      </Dialog>
    </div>
  );
}

/** Chip "dari" (negative) → chip "ke" (positive). */
function ChipTransaksi({
  dari,
  ke,
  kecil = false,
}: {
  dari: string;
  ke: string;
  kecil?: boolean;
}) {
  const chip = kecil
    ? "rounded-sm px-2.5 py-1 text-[13px] font-bold"
    : "rounded-sm px-3 py-1.5 text-sm font-bold";
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className={cn(chip, "truncate bg-negative-soft text-negative")}>
        {dari}
      </span>
      <ArrowRight
        aria-hidden="true"
        className={cn("shrink-0 text-muted-foreground", kecil ? "size-3.5" : "size-4")}
      />
      <span className="sr-only">ke</span>
      <span className={cn(chip, "truncate bg-positive-soft text-positive")}>
        {ke}
      </span>
    </div>
  );
}
