import type { SaldoAnggota } from "@/types/saldo";
import {
  sederhanakanUtang,
  type CatatanUtang,
  type TransaksiPelunasan,
} from "./algoritma/sederhanakanUtang";

/**
 * Memetakan daftar `SaldoAnggota` (dari view `saldo_bersih`) menjadi
 * array `CatatanUtang[]` yang siap diolah oleh `sederhanakanUtang()`.
 *
 * @param daftarSaldo Array SaldoAnggota dari view `saldo_bersih`
 * @returns Array TransaksiPelunasan (hasil pemangkasan utang minimum)
 */
export function hitungSettlementGrup(
  daftarSaldo: SaldoAnggota[]
): TransaksiPelunasan[] {
  if (!daftarSaldo || daftarSaldo.length === 0) return [];

  const DUMMY_HUB = "__HUB_DUMMY__";
  const catatan: CatatanUtang[] = [];

  for (const item of daftarSaldo) {
    const s = Math.round(Number(item.saldo));
    if (s < 0) {
      // Debitur: punya utang ke grup
      catatan.push({
        dariAnggotaId: item.anggota_id,
        keAnggotaId: DUMMY_HUB,
        jumlah: Math.abs(s),
      });
    } else if (s > 0) {
      // Kreditur: berhak menerima piutang dari grup
      catatan.push({
        dariAnggotaId: DUMMY_HUB,
        keAnggotaId: item.anggota_id,
        jumlah: s,
      });
    }
  }

  return sederhanakanUtang(catatan);
}
