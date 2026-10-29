import { describe, it, expect } from "vitest";
import { hitungHasilSplit } from "./hitungHasilSplit";

const total = (pembagian: { jumlah_tanggungan: number }[]) =>
  pembagian.reduce((akum, p) => akum + p.jumlah_tanggungan, 0);

describe("hitungHasilSplit", () => {
  it("menolak jika belum ada anggota yang dipilih", () => {
    const hasil = hitungHasilSplit([], 100000, "sama_rata", {}, {});
    expect(hasil.isValid).toBe(false);
    expect(hasil.pembagian).toHaveLength(0);
  });

  it("menolak jika jumlah total tidak lebih dari 0", () => {
    const hasil = hitungHasilSplit(["A"], 0, "sama_rata", {}, {});
    expect(hasil.isValid).toBe(false);
  });

  it("sama rata: sisa pembagian dibagikan ke anggota pertama tanpa selisih", () => {
    const hasil = hitungHasilSplit(["A", "B", "C"], 100, "sama_rata", {}, {});
    expect(hasil.isValid).toBe(true);
    expect(hasil.pembagian.map((p) => p.jumlah_tanggungan)).toEqual([34, 33, 33]);
    expect(total(hasil.pembagian)).toBe(100);
  });

  it("persentase: anggota terakhir menyerap selisih pembulatan", () => {
    const hasil = hitungHasilSplit(
      ["A", "B"],
      1001,
      "persentase",
      { A: "50", B: "50" },
      {},
    );
    expect(hasil.isValid).toBe(true);
    expect(total(hasil.pembagian)).toBe(1001);
    expect(hasil.pembagian[0]).toMatchObject({ anggota_id: "A", persentase: 50 });
  });

  it("persentase: menolak jika total bukan 100%", () => {
    const hasil = hitungHasilSplit(
      ["A", "B"],
      1000,
      "persentase",
      { A: "60", B: "30" },
      {},
    );
    expect(hasil.isValid).toBe(false);
    expect(hasil.errorText).toContain("90.0%");
  });

  it("nominal pasti: valid hanya jika jumlahnya sama dengan total", () => {
    const pas = hitungHasilSplit(
      ["A", "B"],
      50000,
      "nominal_pasti",
      {},
      { A: "20000", B: "30000" },
    );
    expect(pas.isValid).toBe(true);
    expect(pas.pembagian.map((p) => p.jumlah_tanggungan)).toEqual([20000, 30000]);

    const kurang = hitungHasilSplit(
      ["A", "B"],
      50000,
      "nominal_pasti",
      {},
      { A: "20000", B: "20000" },
    );
    expect(kurang.isValid).toBe(false);
    expect(kurang.errorText).toContain("kurang");
  });
});
