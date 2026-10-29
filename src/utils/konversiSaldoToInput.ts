import type { SaldoAnggota } from "@/types/saldo";
import {
  sederhanakanUtang,
  type CatatanUtang,
  type TransaksiPelunasan,
} from "./algoritma/sederhanakanUtang";

/**
 * Memetakan daftar `SaldoAnggota` (dari view `saldo_bersih`) menjadi
 * array `CatatanUtang[]` antar anggota yang siap diolah oleh `sederhanakanUtang()`.
 *
 * @param daftarSaldo Array SaldoAnggota dari view `saldo_bersih`
 * @returns Array TransaksiPelunasan (hasil pemangkasan utang minimum)
 */
export function hitungSettlementGrup(
  daftarSaldo: SaldoAnggota[]
): TransaksiPelunasan[] {
  if (!daftarSaldo || daftarSaldo.length === 0) return [];

  const saldo = daftarSaldo
    .map((item) => ({ anggotaId: item.anggota_id, nilai: Math.round(Number(item.saldo)) }))
    .filter(({ nilai }) => nilai !== 0);

  // Koreksi selisih (data tidak konsisten / pembulatan) pada saldo terbesar
  // agar total tepat nol, sama seperti koreksi di sederhanakanUtang().
  const selisih = saldo.reduce((akum, s) => akum + s.nilai, 0);
  if (selisih !== 0) {
    saldo.sort((a, b) => Math.abs(b.nilai) - Math.abs(a.nilai));
    saldo[0].nilai -= selisih;
  }

  // Pasangkan debitur dengan kreditur secara berurutan; net saldo tiap
  // anggota tetap sama, lalu sederhanakanUtang() memilih pasangan optimal.
  const debitur = saldo.filter((s) => s.nilai < 0).map((s) => ({ anggotaId: s.anggotaId, sisa: -s.nilai }));
  const kreditur = saldo.filter((s) => s.nilai > 0).map((s) => ({ anggotaId: s.anggotaId, sisa: s.nilai }));
  const catatan: CatatanUtang[] = [];

  let i = 0;
  let j = 0;
  while (i < debitur.length && j < kreditur.length) {
    const jumlah = Math.min(debitur[i].sisa, kreditur[j].sisa);
    catatan.push({
      dariAnggotaId: debitur[i].anggotaId,
      keAnggotaId: kreditur[j].anggotaId,
      jumlah,
    });
    debitur[i].sisa -= jumlah;
    kreditur[j].sisa -= jumlah;
    if (debitur[i].sisa === 0) i++;
    if (kreditur[j].sisa === 0) j++;
  }

  return sederhanakanUtang(catatan);
}
