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

export function conflict(message: string): ApiError {
  return new ApiError(409, "CONFLICT", message);
}

export function tooManyRequests(message = "Too many requests"): ApiError {
  return new ApiError(429, "RATE_LIMITED", message);
}
