// Jalankan: npx vitest run src/utils/algoritma/sederhanakanUtang.test.ts

import { describe, it, expect } from 'vitest';
import { sederhanakanUtang, CatatanUtang } from './sederhanakanUtang';

/** Helper: pastikan hasil transaksi benar-benar melunasi seluruh saldo asal */
function saldoSetelahDiterapkan(catatan: CatatanUtang[], hasil: ReturnType<typeof sederhanakanUtang>) {
  const saldo = new Map<string, number>();
  for (const { dariAnggotaId, keAnggotaId, jumlah } of catatan) {
    if (dariAnggotaId === keAnggotaId || jumlah <= 0) continue;
    saldo.set(dariAnggotaId, (saldo.get(dariAnggotaId) ?? 0) - jumlah);
    saldo.set(keAnggotaId, (saldo.get(keAnggotaId) ?? 0) + jumlah);
  }
  for (const t of hasil) {
    saldo.set(t.dariAnggotaId, (saldo.get(t.dariAnggotaId) ?? 0) + t.jumlah);
    saldo.set(t.keAnggotaId, (saldo.get(t.keAnggotaId) ?? 0) - t.jumlah);
  }
  return saldo;
}

describe('sederhanakanUtang', () => {
  it('mengembalikan array kosong untuk input kosong', () => {
    expect(sederhanakanUtang([])).toEqual([]);
  });

  it('mengabaikan self-loop (dari === ke)', () => {
    expect(sederhanakanUtang([{ dariAnggotaId: 'A', keAnggotaId: 'A', jumlah: 1000 }])).toEqual([]);
  });

  it('mengabaikan jumlah nol atau negatif', () => {
    expect(sederhanakanUtang([{ dariAnggotaId: 'A', keAnggotaId: 'B', jumlah: 0 }])).toEqual([]);
  });

  it('tidak menghasilkan transaksi bila saldo sudah impas', () => {
    const catatan: CatatanUtang[] = [
      { dariAnggotaId: 'A', keAnggotaId: 'B', jumlah: 50000 },
      { dariAnggotaId: 'B', keAnggotaId: 'A', jumlah: 50000 },
    ];
    expect(sederhanakanUtang(catatan)).toEqual([]);
  });

  it('kasus 2 orang sederhana: 1 transaksi', () => {
    const hasil = sederhanakanUtang([{ dariAnggotaId: 'A', keAnggotaId: 'B', jumlah: 100000 }]);
    expect(hasil).toEqual([{ dariAnggotaId: 'A', keAnggotaId: 'B', jumlah: 100000 }]);
  });

  it('menghasilkan pengurangan transaksi utk kasus 3 kreditur x 2 debitur (kontra-contoh two-pointer)', () => {
    // debitur D1=-51, D2=-50 ; kreditur C1=50, C2=50, C3=1
    // greedy heap terbukti hanya perlu 3 transaksi (bandingkan versi two-pointer polos = 4)
    const catatan: CatatanUtang[] = [
      { dariAnggotaId: 'D1', keAnggotaId: 'C1', jumlah: 50 },
      { dariAnggotaId: 'D1', keAnggotaId: 'C2', jumlah: 1 },
      { dariAnggotaId: 'D2', keAnggotaId: 'C2', jumlah: 49 },
      { dariAnggotaId: 'D2', keAnggotaId: 'C3', jumlah: 1 },
    ];
    const hasil = sederhanakanUtang(catatan);
    expect(hasil.length).toBe(3);
    const saldoAkhir = saldoSetelahDiterapkan(catatan, hasil);
    for (const nilai of saldoAkhir.values()) expect(Math.abs(nilai)).toBeLessThan(1);
  });

  it('tidak pernah menghasilkan jumlah <= 0 pada transaksi', () => {
    const catatan: CatatanUtang[] = [
      { dariAnggotaId: 'A', keAnggotaId: 'B', jumlah: 33333 },
      { dariAnggotaId: 'C', keAnggotaId: 'B', jumlah: 33333 },
      { dariAnggotaId: 'D', keAnggotaId: 'B', jumlah: 33334 },
    ];
    const hasil = sederhanakanUtang(catatan);
    expect(hasil.every((t) => t.jumlah > 0)).toBe(true);
  });

  it('semua saldo impas (dalam toleransi Rp1) setelah transaksi diterapkan — stress test acak', () => {
    for (let iterasi = 0; iterasi < 25; iterasi++) {
      const orang = Array.from({ length: 15 }, (_, i) => `P${i}`);
      const catatan: CatatanUtang[] = Array.from({ length: 60 }, () => {
        const dari = orang[Math.floor(Math.random() * orang.length)];
        let ke = orang[Math.floor(Math.random() * orang.length)];
        while (ke === dari) ke = orang[Math.floor(Math.random() * orang.length)];
        return { dariAnggotaId: dari, keAnggotaId: ke, jumlah: Math.floor(Math.random() * 500000) + 1 };
      });
      const hasil = sederhanakanUtang(catatan);
      const saldoAkhir = saldoSetelahDiterapkan(catatan, hasil);
      for (const [anggotaId, nilai] of saldoAkhir.entries()) {
        expect(Math.abs(nilai), `anggota ${anggotaId} pada iterasi ${iterasi} belum impas`).toBeLessThan(1);
      }
      expect(hasil.every((t) => t.jumlah > 0)).toBe(true);
      expect(hasil.length).toBeLessThanOrEqual(orang.length - 1);
    }
  });
});
