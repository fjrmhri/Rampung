import type { JenisSplit } from "@/types/pengeluaran";

/** Nominal tanpa tanda: `Rp 70.000`. */
export function formatRupiah(nilai: number) {
  return `Rp ${Math.abs(nilai).toLocaleString("id-ID")}`;
}

/**
 * Saldo bertanda: `+Rp 140.000`, `−Rp 70.000` (minus U+2212 di depan "Rp"),
 * atau `Rp 0`.
 */
export function formatSaldo(saldo: number) {
  if (saldo > 0) return `+${formatRupiah(saldo)}`;
  if (saldo < 0) return `−${formatRupiah(saldo)}`;
  return "Rp 0";
}

const LABEL_JENIS_SPLIT: Record<JenisSplit, string> = {
  sama_rata: "Sama Rata",
  persentase: "Persentase",
  nominal_pasti: "Nominal Pasti",
};

export function labelJenisSplit(jenis: JenisSplit) {
  return LABEL_JENIS_SPLIT[jenis];
}
