import { describe, it, expect } from "vitest";
import { hitungSettlementGrup } from "./konversiSaldoToInput";
import type { SaldoAnggota } from "@/types/saldo";

describe("hitungSettlementGrup Utility Test", () => {
  it("harus mengonversi saldo bersih menjadi daftar transaksi pelunasan minimum secara tepat", () => {
    const daftarSaldo: SaldoAnggota[] = [
      { anggota_id: "user-A", grup_id: "grup-1", saldo: 150000 },
      { anggota_id: "user-B", grup_id: "grup-1", saldo: -100000 },
      { anggota_id: "user-C", grup_id: "grup-1", saldo: -50000 },
    ];

    const transaksi = hitungSettlementGrup(daftarSaldo);

    expect(transaksi).toHaveLength(2);
    expect(transaksi).toContainEqual({
      dariAnggotaId: "user-B",
      keAnggotaId: "user-A",
      jumlah: 100000,
    });
    expect(transaksi).toContainEqual({
      dariAnggotaId: "user-C",
      keAnggotaId: "user-A",
      jumlah: 50000,
    });
  });

  it("harus mengembalikan array kosong jika seluruh saldo sudah imbang (0)", () => {
    const daftarSaldo: SaldoAnggota[] = [
      { anggota_id: "user-A", grup_id: "grup-1", saldo: 0 },
      { anggota_id: "user-B", grup_id: "grup-1", saldo: 0 },
    ];

    const transaksi = hitungSettlementGrup(daftarSaldo);
    expect(transaksi).toHaveLength(0);
  });
});
