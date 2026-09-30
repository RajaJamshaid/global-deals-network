/**
 * Pure helpers for product search input. No dependencies, so they are
 * easy to unit test. The database layer only ever receives these terms
 * as bound parameters (never concatenated into SQL), and LIKE
 * wildcards typed by the user are escaped so "%" or "_" match
 * literally instead of matching everything.
 */

export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 100;
export const MAX_SEARCH_TERMS = 6;

/** Escapes LIKE/ILIKE wildcards (\\, %, _) so user input matches literally. */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

/**
 * Splits a search query into lower-cased, de-duplicated terms (at most
 * MAX_SEARCH_TERMS). Every term must match somewhere in a product's
 * name/brand/slug/description, so "apple iphone 15" narrows results.
 */
export function parseSearchTerms(raw: string): string[] {
  const seen = new Set<string>();
  const terms: string[] = [];
  for (const part of raw.trim().split(/\s+/)) {
    const term = part.toLowerCase();
    if (term.length === 0 || seen.has(term)) continue;
    seen.add(term);
    terms.push(term);
    if (terms.length >= MAX_SEARCH_TERMS) break;
  }
  return terms;
}
