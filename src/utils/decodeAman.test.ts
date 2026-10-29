import { describe, it, expect } from "vitest";
import { decodeAman } from "./decodeAman";

describe("decodeAman", () => {
  it("men-decode nilai yang valid", () => {
    expect(decodeAman("Link%20tidak%20valid")).toBe("Link tidak valid");
  });

  it("mengembalikan nilai asli untuk input rusak, bukan melempar URIError", () => {
    expect(decodeAman("%")).toBe("%");
    expect(decodeAman("%E0%A4%A")).toBe("%E0%A4%A");
  });
});
