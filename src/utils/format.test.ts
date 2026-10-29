import { describe, it, expect } from "vitest";
import { formatRupiah, formatSaldo, labelJenisSplit } from "./format";

describe("formatRupiah", () => {
  it("memakai pemisah ribuan id-ID tanpa tanda", () => {
    expect(formatRupiah(240000)).toBe("Rp 240.000");
    expect(formatRupiah(-70000)).toBe("Rp 70.000");
  });
});

describe("formatSaldo", () => {
  it("menaruh tanda di depan Rp", () => {
    expect(formatSaldo(140000)).toBe("+Rp 140.000");
    expect(formatSaldo(-70000)).toBe("−Rp 70.000");
  });

  it("nol tanpa tanda, termasuk -0", () => {
    expect(formatSaldo(0)).toBe("Rp 0");
    expect(formatSaldo(-0)).toBe("Rp 0");
  });
});

describe("labelJenisSplit", () => {
  it("memetakan enum ke label", () => {
    expect(labelJenisSplit("sama_rata")).toBe("Sama Rata");
    expect(labelJenisSplit("persentase")).toBe("Persentase");
    expect(labelJenisSplit("nominal_pasti")).toBe("Nominal Pasti");
  });
});
