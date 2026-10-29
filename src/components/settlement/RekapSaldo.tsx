"use client";

import { useMemo } from "react";
import { jsPDF } from "jspdf";
import { Download, FileText, ListChecks } from "lucide-react";
import type { Pengeluaran } from "@/types/pengeluaran";
import type { SaldoAnggota } from "@/types/saldo";
import { escapeCsv } from "@/utils/csv";

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
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm animate-pulse space-y-4">
        <div className="h-4 w-1/3 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
        <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
        <p className="text-sm font-semibold text-destructive">
          Gagal memuat rekap saldo.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  if (!daftarSaldo || daftarSaldo.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
        <ListChecks className="mx-auto mb-3 h-8 w-8 text-primary" />
        <p className="text-sm font-semibold text-foreground">
          Tidak ada data saldo untuk ditampilkan.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Tambahkan pengeluaran agar rekap saldo dan histori pengeluaran bisa
          terbentuk.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">
            Rekap Saldo & Histori Pengeluaran
          </h2>
          <p className="text-xs text-muted-foreground">
            Gunakan data yang sama dengan dashboard untuk ekspor CSV / PDF.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              downloadCSV(grupNama, daftarSaldo, daftarPengeluaran)
            }
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
          <button
            type="button"
            onClick={() =>
              downloadPDF(grupNama, daftarSaldo, daftarPengeluaran)
            }
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition"
          >
            <FileText className="h-4 w-4" /> PDF
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              className="rounded-2xl border border-border bg-background p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {item.anggota?.nama_tampilan || "Anggota"}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {status}
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {formatRupiah(saldo)}
                </p>
              </div>
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <p>Total Pengeluaran: {formatRupiah(totalPengeluaran)}</p>
                <p>Jumlah Transaksi: {pengeluaran.length}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Rincian Pengeluaran per Anggota
          </h3>
        </div>

        {daftarSaldo.map((item) => {
          const pengeluaran = pengeluaranPerAnggota.get(item.anggota_id) ?? [];
          return (
            <div
              key={item.anggota_id}
              className="rounded-2xl border border-border bg-background p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-foreground">
                  {item.anggota?.nama_tampilan || "Anggota"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pengeluaran.length} pengeluaran
                </p>
              </div>
              {pengeluaran.length === 0 ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Belum ada pengeluaran yang dibayar oleh anggota ini.
                </p>
              ) : (
                <div className="mt-3 grid gap-2">
                  {pengeluaran.map((transaksi) => (
                    <div
                      key={transaksi.id}
                      className="rounded-2xl border border-border/70 bg-card p-3 text-xs"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-semibold text-foreground">
                          {transaksi.deskripsi}
                        </p>
                        <span className="text-muted-foreground">
                          {new Date(transaksi.dibuat_pada).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {formatRupiah(transaksi.jumlah_total)}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Jenis split: {transaksi.jenis_split}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
