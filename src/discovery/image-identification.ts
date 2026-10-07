import {
  badRequest,
  payloadTooLarge,
  unsupportedMediaType,
} from "../api/http/errors.js";

/**
 * Image-search boundary (architecture only - there is NO image
 * recognition provider yet).
 *
 * - validateImageUpload() checks what the client sent: declared type,
 *   size and the real file signature. The client's filename is never used
 *   (the upload is the raw image body, so there is no filename at all).
 * - ImageIdentificationProvider is the plug-in point for a future
 *   recognition service. A provider only ever returns a canonical
 *   product_id; the normal product + comparison pipeline does the rest.
 * - Nothing is stored: the bytes live in memory for the request only.
 * - getConfiguredImageProvider() returns null today, so the endpoint
 *   answers "unavailable" instead of guessing.
 */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export interface ImageUpload {
  data: Buffer;
  mimeType: AllowedImageType;
}

export interface IdentifiedProduct {
  /** Canonical GDN product id. The service re-checks it exists; providers are not trusted. */
  productId: string;
}

export interface ImageIdentificationProvider {
  readonly name: string;
  /** Null = the image was not recognised as a known product. */
  identify(image: ImageUpload): Promise<IdentifiedProduct | null>;
}

/** No provider is approved or configured yet. */
export function getConfiguredImageProvider(): ImageIdentificationProvider | null {
  return null;
}

function isAllowedType(value: string): value is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(value);
}

function matchesSignature(data: Buffer, mimeType: AllowedImageType): boolean {
  switch (mimeType) {
    case "image/jpeg":
      return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
    case "image/png":
      return (
        data.length >= 8 &&
        data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      );
    case "image/webp":
      return (
        data.length >= 12 &&
        data.subarray(0, 4).toString("latin1") === "RIFF" &&
        data.subarray(8, 12).toString("latin1") === "WEBP"
      );
  }
}

/** Validates an uploaded image body; throws 400 / 413 / 415. */
export function validateImageUpload(body: unknown, contentTypeHeader: unknown): ImageUpload {
  const declared = String(contentTypeHeader ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (!isAllowedType(declared)) {
    throw unsupportedMediaType("Supported image types: image/jpeg, image/png, image/webp");
  }
  if (!Buffer.isBuffer(body) || body.length === 0) {
    throw badRequest("Request body must be the image file");
  }
  if (body.length > MAX_IMAGE_BYTES) {
    throw payloadTooLarge(`Image must be at most ${MAX_IMAGE_BYTES / (1024 * 1024)} MB`);
  }
  if (!matchesSignature(body, declared)) {
    throw badRequest("Image content does not match its declared type");
  }
  return { data: body, mimeType: declared };
}
