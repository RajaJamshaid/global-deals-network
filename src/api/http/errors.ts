/**
 * Structured API errors.
 *
 * Per docs/architecture/GDN_API_Architecture.md ("Error Response
 * Structure"): every error response uses { success: false, error: {
 * code, message } }. Services/routes throw these instead of letting
 * raw exceptions (including PostgreSQL errors) reach the client - see
 * server.ts's setErrorHandler, which is the only place that formats
 * the HTTP response.
 */
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "RESOURCE_NOT_FOUND"
  | "CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "IMAGE_IDENTIFICATION_UNAVAILABLE"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: ApiErrorCode;

  constructor(statusCode: number, code: ApiErrorCode, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function badRequest(message: string): ApiError {
  return new ApiError(400, "VALIDATION_ERROR", message);
}

/**
 * Deliberately generic: the same response is used for a missing
 * credential, a wrong credential and a server that has no credential
 * configured, so the response never reveals which case applied.
 */
export function unauthorized(): ApiError {
  return new ApiError(401, "UNAUTHORIZED", "Unauthorized");
}

export function notFound(resource: string): ApiError {
  return new ApiError(404, "RESOURCE_NOT_FOUND", `${resource} not found`);
}

/** A 404 with a specific message, for "product not found for this barcode/image". */
export function notFoundWithMessage(message: string): ApiError {
  return new ApiError(404, "RESOURCE_NOT_FOUND", message);
}

export function conflict(message: string): ApiError {
  return new ApiError(409, "CONFLICT", message);
}

export function tooManyRequests(message = "Too many requests"): ApiError {
  return new ApiError(429, "RATE_LIMITED", message);
}

export function payloadTooLarge(message: string): ApiError {
  return new ApiError(413, "PAYLOAD_TOO_LARGE", message);
}

export function unsupportedMediaType(message: string): ApiError {
  return new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", message);
}

/** No image-recognition provider is configured: an explicit state, never a guess. */
export function imageIdentificationUnavailable(): ApiError {
  return new ApiError(
    503,
    "IMAGE_IDENTIFICATION_UNAVAILABLE",
    "Image identification is not available right now",
  );
}
