import { describe, expect, it } from "vitest";
import { ApiError } from "../../src/api/http/errors.js";
import {
  MAX_IMAGE_BYTES,
  getConfiguredImageProvider,
  validateImageUpload,
} from "../../src/discovery/image-identification.js";

const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(24),
]);
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(24)]);
const WEBP = Buffer.concat([
  Buffer.from("RIFF", "latin1"),
  Buffer.from([0x10, 0x00, 0x00, 0x00]),
  Buffer.from("WEBP", "latin1"),
  Buffer.alloc(16),
]);

function statusOf(fn: () => unknown): number | "ok" {
  try {
    fn();
  } catch (error) {
    if (error instanceof ApiError) return error.statusCode;
    throw error;
  }
  return "ok";
}

describe("validateImageUpload", () => {
  it("accepts JPEG, PNG and WebP whose bytes match the declared type", () => {
    expect(validateImageUpload(PNG, "image/png").mimeType).toBe("image/png");
    expect(validateImageUpload(JPEG, "image/jpeg").mimeType).toBe("image/jpeg");
    expect(validateImageUpload(WEBP, "image/webp").mimeType).toBe("image/webp");
    expect(validateImageUpload(PNG, "IMAGE/PNG; charset=binary").mimeType).toBe("image/png");
  });

  it("rejects unsupported or missing media types (415)", () => {
    for (const type of ["image/gif", "image/svg+xml", "text/plain", "application/json", "", undefined]) {
      expect(statusOf(() => validateImageUpload(PNG, type))).toBe(415);
    }
  });

  it("rejects an empty or non-binary body (400)", () => {
    expect(statusOf(() => validateImageUpload(Buffer.alloc(0), "image/png"))).toBe(400);
    expect(statusOf(() => validateImageUpload(undefined, "image/png"))).toBe(400);
    expect(statusOf(() => validateImageUpload({ not: "an image" }, "image/png"))).toBe(400);
    expect(statusOf(() => validateImageUpload("a string", "image/png"))).toBe(400);
  });

  it("rejects content that does not match the declared type (400)", () => {
    expect(statusOf(() => validateImageUpload(JPEG, "image/png"))).toBe(400);
    expect(statusOf(() => validateImageUpload(PNG, "image/jpeg"))).toBe(400);
    expect(statusOf(() => validateImageUpload(Buffer.from("<svg></svg>"), "image/png"))).toBe(400);
    expect(statusOf(() => validateImageUpload(Buffer.from("RIFFxxxxWAVE"), "image/webp"))).toBe(400);
  });

  it("rejects an oversized image (413)", () => {
    const big = Buffer.concat([PNG, Buffer.alloc(MAX_IMAGE_BYTES)]);
    expect(statusOf(() => validateImageUpload(big, "image/png"))).toBe(413);
  });
});

describe("image provider boundary", () => {
  it("has no recognition provider configured today (no fake identification)", () => {
    expect(getConfiguredImageProvider()).toBeNull();
  });
});
