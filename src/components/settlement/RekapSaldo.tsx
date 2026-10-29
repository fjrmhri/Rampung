"use client";

import { useMemo } from "react";
import { jsPDF } from "jspdf";
import { Download, FileText, ListChecks } from "lucide-react";
import type { Pengeluaran } from "@/types/pengeluaran";
import type { SaldoAnggota } from "@/types/saldo";
import { escapeCsv } from "@/utils/csv";
import { formatSaldo, labelJenisSplit } from "@/utils/format";
import { cn } from "@/lib/cn";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

const WARNA_STATUS: Record<string, string> = {
  Piutang: "text-positive",
  Utang: "text-negative",
  Impas: "text-muted-foreground",
};

const kartuRekap = "flex flex-col p-[clamp(18px,3vw,28px)] shadow-xs";

interface RekapSaldoProps {
  grupNama: string;
  daftarSaldo: SaldoAnggota[];
  daftarPengeluaran?: Pengeluaran[];
  isLoading: boolean;
  error?: Error | null;
}

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function getTransactionStatus(saldo: number) {
  if (saldo > 0) return "Piutang";
  if (saldo < 0) return "Utang";
  return "Impas";
}

function buildCsvPayload(
  daftarSaldo: SaldoAnggota[],
  daftarPengeluaran?: Pengeluaran[],
) {
  const lines: string[] = [];
  lines.push("Rekap Saldo Anggota");
  lines.push("Nama Anggota,Saldo,Status,Total Pengeluaran");

  const pengeluaranPerAnggota = new Map<string, number>();
  daftarPengeluaran?.forEach((item) => {
    pengeluaranPerAnggota.set(
      item.dibayar_oleh,
      (pengeluaranPerAnggota.get(item.dibayar_oleh) ?? 0) +
        Number(item.jumlah_total),
    );
  });

  daftarSaldo.forEach((item) => {
    lines.push(
      [
        escapeCsv(item.anggota?.nama_tampilan ?? "Anggota"),
        escapeCsv(item.saldo),
        escapeCsv(getTransactionStatus(item.saldo)),
        escapeCsv(pengeluaranPerAnggota.get(item.anggota_id) ?? 0),
      ].join(","),
    );
  });

  lines.push("");
  lines.push("Riwayat Pengeluaran");
  lines.push("Tanggal,Pembayar,Deskripsi,Jumlah,Jenis Split");

  daftarPengeluaran?.forEach((item) => {
    lines.push(
      [
        escapeCsv(
          new Date(item.dibuat_pada).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        ),
        escapeCsv(item.pembayar?.nama_tampilan ?? "Anggota"),
        escapeCsv(item.deskripsi),
        escapeCsv(item.jumlah_total),
        escapeCsv(item.jenis_split),
      ].join(","),
    );
  });

  return lines.join("\r\n");
}

function downloadCSV(
  grupNama: string,
  daftarSaldo: SaldoAnggota[],
  daftarPengeluaran?: Pengeluaran[],
) {
  const csvContent = buildCsvPayload(daftarSaldo, daftarPengeluaran);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${grupNama.replace(/\s+/g, "_")}_rekap_saldo.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadPDF(
  grupNama: string,
  daftarSaldo: SaldoAnggota[],
  daftarPengeluaran?: Pengeluaran[],
) {
  const tanggal = new Date().toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  let y = 50;

  doc.setFontSize(16);
  doc.text(`Rekap Saldo & Pengeluaran - ${grupNama}`, margin, y);
  doc.setFontSize(10);
  doc.text(`Tanggal: ${tanggal}`, margin, y + 18);
  y += 40;

  doc.setFontSize(12);
  doc.text("Ringkasan Saldo Anggota", margin, y);
  y += 18;

  const pengeluaranPerAnggota = new Map<string, number>();
  daftarPengeluaran?.forEach((item) => {
    pengeluaranPerAnggota.set(
      item.dibayar_oleh,
      (pengeluaranPerAnggota.get(item.dibayar_oleh) ?? 0) +
        Number(item.jumlah_total),
    );
  });

  daftarSaldo.forEach((item) => {
    const row = `${item.anggota?.nama_tampilan ?? "Anggota"} — ${formatRupiah(item.saldo)} (${getTransactionStatus(item.saldo)}) — Total Pengeluaran: ${formatRupiah(
      pengeluaranPerAnggota.get(item.anggota_id) ?? 0,
    )}`;
    const lines = doc.splitTextToSize(row, 520);
    doc.text(lines, margin, y);
    y += lines.length * 14;
    if (y > 740) {
      doc.addPage();
      y = 50;
    }
  });

  y += 18;
  doc.setFontSize(12);
  doc.text("Riwayat Pengeluaran", margin, y);
  y += 18;

  if (!daftarPengeluaran || daftarPengeluaran.length === 0) {
    doc.setFontSize(10);
    doc.text("Tidak ada riwayat pengeluaran.", margin, y);
  } else {
    doc.setFontSize(10);
    daftarPengeluaran.forEach((item) => {
      const text = `${new Date(item.dibuat_pada).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })} — ${item.pembayar?.nama_tampilan ?? "Anggota"} — ${item.deskripsi} — ${formatRupiah(
        item.jumlah_total,
      )} — ${item.jenis_split}`;
      const lines = doc.splitTextToSize(text, 520);
      doc.text(lines, margin, y);
      y += lines.length * 14;
      if (y > 740) {
        doc.addPage();
        y = 50;
      }
    });
  }

  doc.save(`${grupNama.replace(/\s+/g, "_")}_rekap_saldo.pdf`);
}

export default function RekapSaldo({
  grupNama,
  daftarSaldo,
  daftarPengeluaran,
  isLoading,
  error,
}: RekapSaldoProps) {
  const pengeluaranPerAnggota = useMemo(() => {
    const map = new Map<string, Pengeluaran[]>();
    daftarPengeluaran?.forEach((item) => {
      const list = map.get(item.dibayar_oleh) ?? [];
      list.push(item);
      map.set(item.dibayar_oleh, list);
    });
    return map;
  }, [daftarPengeluaran]);

  if (isLoading) {
    return (
      <Card aria-busy="true" className={cn(kartuRekap, "gap-5")}>
        <span className="sr-only">Memuat rekap saldo</span>
        <Skeleton className="h-[18px] w-1/3" />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,190px),1fr))] gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-40 rounded-lg" />
      </Card>
    );
  }

  if (error) {
    return (
      <Alert size="lg" title="Gagal memuat rekap saldo.">
        <p className="mt-1 font-normal">{error.message}</p>
      </Alert>
    );
  }

  if (!daftarSaldo || daftarSaldo.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border-[1.5px] border-dashed border-input bg-card px-6 py-8 text-center">
        <ListChecks aria-hidden="true" className="mb-1 size-8 text-primary" />
        <p className="text-sm font-bold">
          Tidak ada data saldo untuk ditampilkan.
        </p>
        <p className="max-w-[400px] text-[13px] text-pretty text-muted-foreground">
          Tambahkan pengeluaran agar rekap saldo dan histori pengeluaran bisa
          terbentuk.
        </p>
      </div>
    );
  }

  return (
    <Card
      as="section"
      aria-labelledby="judul-rekap"
      className={cn(kartuRekap, "gap-5")}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-[1_1_260px] flex-col gap-1">
          <h2
            id="judul-rekap"
            className="text-lg font-extrabold tracking-[-0.01em]"
          >
            Rekap Saldo &amp; Histori Pengeluaran
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Gunakan data yang sama dengan dashboard untuk ekspor CSV / PDF.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() =>
              downloadCSV(grupNama, daftarSaldo, daftarPengeluaran)
            }
          >
            <Download aria-hidden="true" className="size-[15px]" /> CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              downloadPDF(grupNama, daftarSaldo, daftarPengeluaran)
            }
          >
            <FileText aria-hidden="true" className="size-[15px]" /> PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,190px),1fr))] gap-3">
        {daftarSaldo.map((item) => {
          const saldo = item.saldo;
          const status = getTransactionStatus(saldo);
          const pengeluaran = pengeluaranPerAnggota.get(item.anggota_id) ?? [];
          const totalPengeluaran = pengeluaran.reduce(
            (acc, entry) => acc + Number(entry.jumlah_total),
            0,
          );

          return (
            <div
              key={item.anggota_id}
              className="flex flex-col gap-2.5 rounded-lg border border-border px-4 py-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    {item.anggota?.nama_tampilan || "Anggota"}
                  </p>
                  <p
                    className={cn(
                      "text-xs font-semibold",
                      WARNA_STATUS[status],
                    )}
                  >
                    {status}
                  </p>
                </div>
                <p
                  className={cn(
                    "shrink-0 text-[15px] font-extrabold tabular-nums",
                    WARNA_STATUS[status],
                  )}
                >
                  {formatSaldo(saldo)}
                </p>
              </div>
              <div className="flex flex-col gap-0.5 text-[13px] text-muted-foreground">
                <p>
                  Total Pengeluaran:{" "}
                  <span className="whitespace-nowrap tabular-nums">
                    {formatRupiah(totalPengeluaran)}
                  </span>
                </p>
                <p>Jumlah Transaksi: {pengeluaran.length}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ListChecks aria-hidden="true" className="size-4 text-primary" />
          <h3 className="text-[15px] font-bold">
            Rincian Pengeluaran per Anggota
          </h3>
        </div>

        {daftarSaldo.map((item) => {
          const pengeluaran = pengeluaranPerAnggota.get(item.anggota_id) ?? [];
          return (
            <div
              key={item.anggota_id}
              className="overflow-hidden rounded-lg border border-border"
            >
              <div className="flex items-center justify-between gap-2 bg-surface-header px-4 py-3">
                <p className="truncate text-sm font-bold">
                  {item.anggota?.nama_tampilan || "Anggota"}
                </p>
                <p className="shrink-0 text-[13px] text-muted-foreground">
                  {pengeluaran.length} pengeluaran
                </p>
              </div>
              {pengeluaran.length === 0 ? (
                <p className="px-4 py-3 text-[13px] text-muted-foreground">
                  Belum ada pengeluaran yang dibayar oleh anggota ini.
                </p>
              ) : (
                pengeluaran.map((transaksi) => (
                  <div
                    key={transaksi.id}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t border-muted px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold break-words">
                        {transaksi.deskripsi}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaksi.dibuat_pada).toLocaleDateString(
                          "id-ID",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}{" "}
                        · Jenis split: {labelJenisSplit(transaksi.jenis_split)}
                      </p>
                    </div>
                    <p className="text-sm font-extrabold tabular-nums">
                      {formatRupiah(transaksi.jumlah_total)}
                    </p>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
