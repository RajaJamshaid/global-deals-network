import { badRequest } from "./errors.js";

/**
 * Manual request validation helpers - no schema-validation library
 * dependency added, per CODE QUALITY ("avoid unnecessary
 * dependencies"). Every POST/PATCH body field and every :id path
 * param passes through one of these before reaching a repository
 * query, per the Stage 1C task's validation requirements.
 */
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function requireUuidParam(value: unknown, fieldName: string): string {
  if (!isUuid(value)) {
    throw badRequest(`${fieldName} must be a valid UUID`);
  }
  return value;
}

export function requireString(
  body: Record<string, unknown>,
  field: string,
): string {
  const value = body[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw badRequest(`${field} is required and must be a non-empty string`);
  }
  return value;
}

export function optionalString(
  body: Record<string, unknown>,
  field: string,
): string | undefined {
  const value = body[field];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw badRequest(`${field} must be a string`);
  }
  return value;
}

export function requireNumber(
  body: Record<string, unknown>,
  field: string,
): number {
  const value = body[field];
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw badRequest(`${field} is required and must be a number`);
  }
  return value;
}

export function optionalNumber(
  body: Record<string, unknown>,
  field: string,
): number | undefined {
  const value = body[field];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw badRequest(`${field} must be a number`);
  }
  return value;
}

export function optionalBoolean(
  body: Record<string, unknown>,
  field: string,
): boolean | undefined {
  const value = body[field];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "boolean") {
    throw badRequest(`${field} must be a boolean`);
  }
  return value;
}

export function requireEnum<T extends string>(
  body: Record<string, unknown>,
  field: string,
  allowed: readonly T[],
): T {
  const value = body[field];
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw badRequest(`${field} must be one of: ${allowed.join(", ")}`);
  }
  return value as T;
}

export function optionalEnum<T extends string>(
  body: Record<string, unknown>,
  field: string,
  allowed: readonly T[],
): T | undefined {
  const value = body[field];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw badRequest(`${field} must be one of: ${allowed.join(", ")}`);
  }
  return value as T;
}

export function requireUuid(
  body: Record<string, unknown>,
  field: string,
): string {
  const value = body[field];
  if (!isUuid(value)) {
    throw badRequest(`${field} is required and must be a valid UUID`);
  }
  return value;
}

export function optionalUuid(
  body: Record<string, unknown>,
  field: string,
): string | undefined {
  const value = body[field];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!isUuid(value)) {
    throw badRequest(`${field} must be a valid UUID`);
  }
  return value;
}

export function optionalDate(
  body: Record<string, unknown>,
  field: string,
): string | undefined {
  const value = body[field];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw badRequest(`${field} must be a valid ISO date string`);
  }
  return value;
}
