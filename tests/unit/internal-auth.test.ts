import { describe, expect, it } from "vitest";
import { constantTimeEqual } from "../../src/api/http/constant-time.js";
import { extractBearerToken } from "../../src/api/http/internal-auth.js";

describe("constantTimeEqual", () => {
  it("returns true for identical strings", () => {
    expect(constantTimeEqual("secret-value", "secret-value")).toBe(true);
  });

  it("returns false for different strings of the same length", () => {
    expect(constantTimeEqual("secret-value", "secret-valuf")).toBe(false);
  });

  it("returns false for different lengths (including a prefix)", () => {
    expect(constantTimeEqual("secret", "secret-value")).toBe(false);
    expect(constantTimeEqual("secret-value", "secret")).toBe(false);
    expect(constantTimeEqual("", "secret")).toBe(false);
  });

  it("handles multi-byte characters", () => {
    expect(constantTimeEqual("k\u00e9y", "k\u00e9y")).toBe(true);
    expect(constantTimeEqual("k\u00e9y", "key")).toBe(false);
  });
});

describe("extractBearerToken", () => {
  it("extracts the token from a Bearer header", () => {
    expect(extractBearerToken("Bearer abc123")).toBe("abc123");
  });

  it("is case-insensitive about the scheme", () => {
    expect(extractBearerToken("bearer abc123")).toBe("abc123");
    expect(extractBearerToken("BEARER abc123")).toBe("abc123");
  });

  it("rejects other schemes, missing tokens and non-strings", () => {
    expect(extractBearerToken("Basic abc123")).toBeUndefined();
    expect(extractBearerToken("Bearer")).toBeUndefined();
    expect(extractBearerToken("Bearer ")).toBeUndefined();
    expect(extractBearerToken("abc123")).toBeUndefined();
    expect(extractBearerToken("Bearer two tokens")).toBeUndefined();
    expect(extractBearerToken(undefined)).toBeUndefined();
    expect(extractBearerToken(["Bearer abc"])).toBeUndefined();
  });
});
