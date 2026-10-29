import { describe, it, expect } from "vitest";
import { buttonVariants } from "./Button";

const kelas = (s: string) => s.split(" ");

describe("buttonVariants", () => {
  it("disabled memakai token warna, bukan opacity 50%", () => {
    const c = kelas(buttonVariants({ variant: "primary" }));
    expect(c).toContain("disabled:bg-disabled-bg");
    expect(c).toContain("disabled:text-disabled-fg");
    expect(c).toContain("disabled:cursor-not-allowed");
    expect(c).not.toContain("disabled:opacity-50");
  });

  it("loading memakai opacity 75% dan tidak memakai warna disabled", () => {
    const c = kelas(buttonVariants({ variant: "primary", loading: true }));
    expect(c).toContain("opacity-75");
    expect(c).not.toContain("disabled:bg-disabled-bg");
  });

  it("ukuran hanya berlaku untuk varian kotak", () => {
    expect(kelas(buttonVariants({ size: "sm" }))).toContain("min-h-10");
    expect(kelas(buttonVariants({ size: "xl" }))).toContain("min-h-12");
    const ikon = kelas(buttonVariants({ variant: "icon", size: "xl" }));
    expect(ikon).toContain("size-10");
    expect(ikon).not.toContain("min-h-12");
  });

  it("fullWidth menambah w-full", () => {
    expect(kelas(buttonVariants({ fullWidth: true }))).toContain("w-full");
  });
});
