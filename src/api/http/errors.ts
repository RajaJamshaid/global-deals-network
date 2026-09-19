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
  | "RESOURCE_NOT_FOUND"
  | "CONFLICT"
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

export function notFound(resource: string): ApiError {
  return new ApiError(404, "RESOURCE_NOT_FOUND", `${resource} not found`);
}

export function conflict(message: string): ApiError {
  return new ApiError(409, "CONFLICT", message);
}
