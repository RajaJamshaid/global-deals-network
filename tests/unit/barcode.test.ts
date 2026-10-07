import { describe, expect, it } from "vitest";
import { ApiError } from "../../src/api/http/errors.js";
import { hasValidCheckDigit, parseBarcode } from "../../src/discovery/barcode.js";

function expectBadRequest(fn: () => unknown): void {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).statusCode).toBe(400);
    expect((error as ApiError).code).toBe("VALIDATION_ERROR");
    return;
  }
  throw new Error("expected a 400");
}

describe("parseBarcode", () => {
  it("accepts UPC-A, EAN-8, EAN-13 and GTIN-14 and normalises to 14 digits", () => {
    expect(parseBarcode("036000291452")).toBe("00036000291452"); // UPC-A
    expect(parseBarcode("4006381333931")).toBe("04006381333931"); // EAN-13
    expect(parseBarcode("96385074")).toBe("00000096385074"); // EAN-8
    expect(parseBarcode("14006381333938")).toBe("14006381333938"); // GTIN-14
  });

  it("treats a UPC-A and its EAN-13 form as the same barcode", () => {
    expect(parseBarcode("036000291452")).toBe(parseBarcode("0036000291452"));
  });

  it("ignores surrounding whitespace", () => {
    expect(parseBarcode("  036000291452 ")).toBe("00036000291452");
  });

  it("rejects empty, missing and non-string input", () => {
    expectBadRequest(() => parseBarcode(""));
    expectBadRequest(() => parseBarcode("   "));
    expectBadRequest(() => parseBarcode(undefined));
    expectBadRequest(() => parseBarcode(null));
    expectBadRequest(() => parseBarcode(36000291452));
    expectBadRequest(() => parseBarcode(["036000291452"]));
  });

  it("rejects non-numeric and malformed codes", () => {
    for (const code of ["abcdefgh", "0360002914x2", "036-000-291-452", "036000291.52", "1' OR '1'='1", "--"]) {
      expectBadRequest(() => parseBarcode(code));
    }
  });

  it("rejects codes of an unsupported length, including very long ones", () => {
    for (const code of ["1", "1234567", "123456789", "12345678901", "123456789012345", "0".repeat(500)]) {
      expectBadRequest(() => parseBarcode(code));
    }
  });

  it("rejects a wrong check digit", () => {
    expectBadRequest(() => parseBarcode("036000291453"));
    expectBadRequest(() => parseBarcode("4006381333932"));
  });
});

describe("hasValidCheckDigit", () => {
  it("validates the GS1 check digit on 14-digit strings only", () => {
    expect(hasValidCheckDigit("00036000291452")).toBe(true);
    expect(hasValidCheckDigit("00036000291453")).toBe(false);
    expect(hasValidCheckDigit("036000291452")).toBe(false);
    expect(hasValidCheckDigit("")).toBe(false);
  });
});
