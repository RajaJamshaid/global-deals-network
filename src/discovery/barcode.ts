import { badRequest } from "../api/http/errors.js";

/**
 * Barcode validation and normalisation (UPC-A, EAN-8, EAN-13, GTIN-14).
 *
 * A barcode is only ever used as a lookup key into product_barcodes - the
 * input is strictly validated first, so arbitrary strings never reach SQL
 * (and the lookup is parameterized regardless). Shorter codes are
 * left-padded with zeros to 14 digits (the GS1 GTIN-14 form), so a UPC-A
 * and the matching EAN-13 are the same barcode.
 */
const VALID_LENGTHS = new Set([8, 12, 13, 14]);
const MAX_RAW_LENGTH = 32;

const INVALID_MESSAGE = "code must be a valid UPC, EAN or GTIN barcode (8, 12, 13 or 14 digits)";

/** GS1 check digit over a 14-digit string. */
export function hasValidCheckDigit(gtin14: string): boolean {
  if (!/^\d{14}$/.test(gtin14)) {
    return false;
  }
  let sum = 0;
  for (let index = 0; index < 13; index += 1) {
    sum += Number(gtin14[index]) * (index % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10 === Number(gtin14[13]);
}

/**
 * Returns the normalised 14-digit GTIN, or throws a 400.
 * Rejects empty, non-string, non-numeric, wrong-length and bad-check-digit input.
 */
export function parseBarcode(raw: unknown): string {
  if (typeof raw !== "string") {
    throw badRequest("code query parameter is required");
  }
  const code = raw.trim();
  if (code.length === 0) {
    throw badRequest("code query parameter is required");
  }
  if (code.length > MAX_RAW_LENGTH || !/^\d+$/.test(code) || !VALID_LENGTHS.has(code.length)) {
    throw badRequest(INVALID_MESSAGE);
  }
  const gtin14 = code.padStart(14, "0");
  if (!hasValidCheckDigit(gtin14)) {
    throw badRequest("code has an invalid check digit");
  }
  return gtin14;
}
