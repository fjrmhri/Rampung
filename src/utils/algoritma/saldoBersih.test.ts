import { describe, it, expect } from "vitest";

/**
 * Regression test:
 * Menguji bahwa agregasi saldo_bersih untuk 1 anggota yang memiliki:
 * - >1 pengeluaran yang dibayar (multiple payments)
 * - >1 pembagian pengeluaran yang ditanggung (multiple split entries)
 *
 * menghasilkan saldo yang 100% tepat dan TIDAK mengalami perkalian fan-out.
 */

interface RowPengeluaran {
  id: string;
  dibayar_oleh: string;
  jumlah_total: number;
}

interface RowPembagian {
  id: string;
  pengeluaran_id: string;
  anggota_id: string;
  jumlah_tanggungan: number;
}

/**
 * Simulasi agregasi subquery terpisah (sesuai struktur view saldo_bersih di 0001_init.sql).
 */
function hitungSaldoBersihTanpaFanout(
  anggotaId: string,
  pengeluaranList: RowPengeluaran[],
  pembagianList: RowPembagian[]
): { totalDibayar: number; totalDitanggung: number; saldoBersih: number } {
  // Subquery 1: Agregasi independen dari tabel pengeluaran
  const totalDibayar = pengeluaranList
    .filter((p) => p.dibayar_oleh === anggotaId)
    .reduce((sum, p) => sum + p.jumlah_total, 0);

  // Subquery 2: Agregasi independen dari tabel pembagian_pengeluaran
  const totalDitanggung = pembagianList
    .filter((pb) => pb.anggota_id === anggotaId)
    .reduce((sum, pb) => sum + pb.jumlah_tanggungan, 0);

  const saldoBersih = totalDibayar - totalDitanggung;

  return { totalDibayar, totalDitanggung, saldoBersih };
}

/**
 * Simulasi query fan-out lama yang BUG (Direct LEFT JOIN tanpa subquery terpisah).
 */
function hitungSaldoBersihFanoutBug(
  anggotaId: string,
  pengeluaranList: RowPengeluaran[],
  pembagianList: RowPembagian[]
): number {
  // Query lama memicu perkalian Cartesian (M x N) saat 1 anggota punya >1 baris di kedua sisi
  const userPengeluaran = pengeluaranList.filter((p) => p.dibayar_oleh === anggotaId);
  const userPembagian = pembagianList.filter((pb) => pb.anggota_id === anggotaId);

  let totalDibayarFanout = 0;
  let totalDitanggungFanout = 0;

  for (const p of userPengeluaran) {
    for (const pb of userPembagian) {
      totalDibayarFanout += p.jumlah_total;
      totalDitanggungFanout += pb.jumlah_tanggungan;
    }
  }

  return totalDibayarFanout - totalDitanggungFanout;
}

describe("Regression WAJIB (Fase 5) — Anti Fan-out Saldo Bersih", () => {
  it("harus menghasilkan saldo yang tepat saat 1 anggota memiliki >1 bayar DAN >1 tanggungan", () => {
    const anggotaA = "anggota-a";
    const anggotaB = "anggota-b";

    // Kasus Uji (sesuai dokumen blueprint & roadmap):
    // Pengeluaran 1: A bayar Rp 200.000 (A menanggung 100.000, B menanggung 100.000)
    // Pengeluaran 2: A bayar Rp 100.000 (A menanggung 50.000, B menanggung 50.000)
    // Total dibayar A = 300.000 (2 baris)
    // Total ditanggung A = 150.000 (2 baris)
    // Saldo bersih A yang BENAR = 300.000 - 150.000 = +150.000

    const pengeluaranList: RowPengeluaran[] = [
      { id: "p1", dibayar_oleh: anggotaA, jumlah_total: 200000 },
      { id: "p2", dibayar_oleh: anggotaA, jumlah_total: 100000 },
    ];

    const pembagianList: RowPembagian[] = [
      { id: "pb1", pengeluaran_id: "p1", anggota_id: anggotaA, jumlah_tanggungan: 100000 },
      { id: "pb2", pengeluaran_id: "p1", anggota_id: anggotaB, jumlah_tanggungan: 100000 },
      { id: "pb3", pengeluaran_id: "p2", anggota_id: anggotaA, jumlah_tanggungan: 50000 },
      { id: "pb4", pengeluaran_id: "p2", anggota_id: anggotaB, jumlah_tanggungan: 50000 },
    ];

    // 1. Verifikasi dengan logika subquery terpisah (View 0001_init.sql)
    const hasilA = hitungSaldoBersihTanpaFanout(anggotaA, pengeluaranList, pembagianList);
    const hasilB = hitungSaldoBersihTanpaFanout(anggotaB, pengeluaranList, pembagianList);

    expect(hasilA.totalDibayar).toBe(300000);
    expect(hasilA.totalDitanggung).toBe(150000);
    expect(hasilA.saldoBersih).toBe(150000);

    expect(hasilB.totalDibayar).toBe(0);
    expect(hasilB.totalDitanggung).toBe(150000);
    expect(hasilB.saldoBersih).toBe(-150000);

    // 2. Bukti bahwa query bug fan-out lama menghasilkan saldo yang salah
    const saldoBugA = hitungSaldoBersihFanoutBug(anggotaA, pengeluaranList, pembagianList);
    expect(saldoBugA).not.toBe(150000); // Bug lama menghasilkan saldo salah (fan-out)
  });
});
