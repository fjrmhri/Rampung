// Debt simplification — greedy min-cash-flow berbasis max-heap.
// Pasangan debitur/kreditur dipilih ulang dari heap pada tiap langkah,
// sehingga sisa saldo yang belum impas selalu dibandingkan terhadap
// SEMUA pihak yang tersisa. Kompleksitas O(n log n).

export interface CatatanUtang {
  dariAnggotaId: string; // debitur
  keAnggotaId: string; // kreditur
  jumlah: number; // satuan Rupiah, integer
}

export interface TransaksiPelunasan {
  dariAnggotaId: string;
  keAnggotaId: string;
  jumlah: number;
}

const TOLERANSI = 1; // saldo < Rp1 dianggap lunas (sisa pembulatan)

interface SimpulSaldo {
  anggotaId: string;
  nilai: number; // selalu disimpan sebagai nilai POSITIF (magnitude)
}

/** Max-heap generik minimal, dipakai terpisah utk sisi kreditur & debitur */
class HeapMaks {
  private data: SimpulSaldo[] = [];

  get ukuran(): number {
    return this.data.length;
  }

  tambah(item: SimpulSaldo): void {
    this.data.push(item);
    let i = this.data.length - 1;
    while (i > 0) {
      const induk = (i - 1) >> 1;
      if (this.data[induk].nilai >= this.data[i].nilai) break;
      [this.data[induk], this.data[i]] = [this.data[i], this.data[induk]];
      i = induk;
    }
  }

  ambilMaks(): SimpulSaldo | undefined {
    if (this.data.length === 0) return undefined;
    const maks = this.data[0];
    const akhir = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = akhir;
      let i = 0;
      const n = this.data.length;
      while (true) {
        const kiri = 2 * i + 1;
        const kanan = 2 * i + 2;
        let terbesar = i;
        if (kiri < n && this.data[kiri].nilai > this.data[terbesar].nilai) terbesar = kiri;
        if (kanan < n && this.data[kanan].nilai > this.data[terbesar].nilai) terbesar = kanan;
        if (terbesar === i) break;
        [this.data[i], this.data[terbesar]] = [this.data[terbesar], this.data[i]];
        i = terbesar;
      }
    }
    return maks;
  }
}

/**
 * Sederhanakan daftar utang pairwise menjadi transaksi settlement minimum.
 * Kompleksitas: O(n log n), n = jumlah anggota dengan saldo != 0.
 */
export function sederhanakanUtang(catatan: CatatanUtang[]): TransaksiPelunasan[] {
  if (catatan.length === 0) return [];

  // 1. Agregasi ke saldo bersih per anggota
  const saldoMap = new Map<string, number>();
  for (const { dariAnggotaId, keAnggotaId, jumlah } of catatan) {
    if (dariAnggotaId === keAnggotaId || jumlah <= 0) continue; // lewati data tidak valid
    saldoMap.set(dariAnggotaId, (saldoMap.get(dariAnggotaId) ?? 0) - jumlah);
    saldoMap.set(keAnggotaId, (saldoMap.get(keAnggotaId) ?? 0) + jumlah);
  }

  const saldo = Array.from(saldoMap.entries())
    .map(([anggotaId, nilai]) => ({ anggotaId, nilai: Math.round(nilai) }))
    .filter(({ nilai }) => Math.abs(nilai) >= TOLERANSI);

  if (saldo.length === 0) return [];

  // 2. Koreksi sisa pembulatan agar total saldo grup tetap tepat nol
  const totalSaldo = saldo.reduce((akum, s) => akum + s.nilai, 0);
  if (totalSaldo !== 0) {
    saldo.sort((a, b) => Math.abs(b.nilai) - Math.abs(a.nilai));
    saldo[0].nilai -= totalSaldo;
  }

  // 3. Greedy heap: tiap langkah selalu ambil kreditur & debitur TERBESAR
  //    yang tersisa (bukan urutan tetap), lalu re-insert sisanya bila belum impas.
  const kreditur = new HeapMaks();
  const debitur = new HeapMaks();
  for (const s of saldo) {
    if (s.nilai > 0) kreditur.tambah({ anggotaId: s.anggotaId, nilai: s.nilai });
    else if (s.nilai < 0) debitur.tambah({ anggotaId: s.anggotaId, nilai: -s.nilai });
  }

  const hasil: TransaksiPelunasan[] = [];
  while (kreditur.ukuran > 0 && debitur.ukuran > 0) {
    const k = kreditur.ambilMaks()!;
    const d = debitur.ambilMaks()!;
    const bayar = Math.min(k.nilai, d.nilai);

    if (bayar >= TOLERANSI) {
      hasil.push({ dariAnggotaId: d.anggotaId, keAnggotaId: k.anggotaId, jumlah: bayar });
    }

    const sisaK = k.nilai - bayar;
    const sisaD = d.nilai - bayar;
    if (sisaK >= TOLERANSI) kreditur.tambah({ anggotaId: k.anggotaId, nilai: sisaK });
    if (sisaD >= TOLERANSI) debitur.tambah({ anggotaId: d.anggotaId, nilai: sisaD });
  }

  return hasil;
}
