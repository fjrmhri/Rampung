import { describe, it, expect } from "vitest";
import { escapeCsv } from "./csv";

describe("escapeCsv", () => {
  it("menetralkan teks yang bisa dibaca sebagai rumus spreadsheet", () => {
    expect(escapeCsv("=SUM(A1:A9)")).toBe("'=SUM(A1:A9)");
    expect(escapeCsv("+62812")).toBe("'+62812");
    expect(escapeCsv("-2")).toBe("'-2");
    expect(escapeCsv("@cmd")).toBe("'@cmd");
  });

  it("tidak mengubah angka, termasuk saldo negatif", () => {
    expect(escapeCsv(-100000)).toBe("-100000");
    expect(escapeCsv(150000)).toBe("150000");
  });

  it("membungkus nilai yang mengandung koma, kutip, atau baris baru", () => {
    expect(escapeCsv("Makan, minum")).toBe('"Makan, minum"');
    expect(escapeCsv('Kopi "susu"')).toBe('"Kopi ""susu"""');
    expect(escapeCsv("baris1\nbaris2")).toBe('"baris1\nbaris2"');
  });

  it("mengembalikan string kosong untuk undefined", () => {
    expect(escapeCsv(undefined)).toBe("");
  });
});
