import { describe, expect, it } from "vitest";
import {
  MAX_SEARCH_TERMS,
  escapeLikePattern,
  parseSearchTerms,
} from "../../src/catalog/search-query.js";

describe("escapeLikePattern", () => {
  it("escapes percent, underscore and backslash", () => {
    expect(escapeLikePattern("50%_off")).toBe("50\\%\\_off");
    expect(escapeLikePattern("a\\b")).toBe("a\\\\b");
  });

  it("leaves ordinary text unchanged", () => {
    expect(escapeLikePattern("iphone 15 pro")).toBe("iphone 15 pro");
  });
});

describe("parseSearchTerms", () => {
  it("splits on whitespace and lower-cases", () => {
    expect(parseSearchTerms("  iPhone   15  PRO ")).toEqual(["iphone", "15", "pro"]);
  });

  it("removes duplicate terms", () => {
    expect(parseSearchTerms("apple Apple iphone")).toEqual(["apple", "iphone"]);
  });

  it("limits the number of terms", () => {
    const terms = parseSearchTerms("a1 b2 c3 d4 e5 f6 g7 h8 i9");
    expect(terms).toHaveLength(MAX_SEARCH_TERMS);
  });

  it("returns no terms for blank input", () => {
    expect(parseSearchTerms("   ")).toEqual([]);
  });
});
