import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Static checks on the functional web/Mini App search page: it must stay a
 * credential-free, XSS-safe client of the public API and must not fake the
 * features that are not available yet.
 */
const page = readFileSync(new URL("../../web/search.html", import.meta.url), "utf8");
const proxy = readFileSync(new URL("../../functions-lib/gdn-proxy.js", import.meta.url), "utf8");

describe("web/search.html", () => {
  it("contains no internal credentials or tokens", () => {
    for (const forbidden of ["GDN_INTERNAL_API_KEY", "Bearer", "TELEGRAM_BOT_TOKEN", "initData", "Authorization"]) {
      expect(page).not.toContain(forbidden);
    }
  });

  it("renders API data with textContent only, never innerHTML", () => {
    expect(page).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(/);
    expect(page).toContain("textContent");
  });

  it("does not fake image or camera-barcode search", () => {
    expect(page).toMatch(/Search by image[^<]*coming soon/i);
    expect(page).toMatch(/Scan barcode with camera[^<]*coming soon/i);
    // Both are disabled placeholders.
    expect(page.match(/<button type="button" disabled>/g)).toHaveLength(2);
  });

  it("sends users to the server-rendered product page and never builds merchant or affiliate URLs", () => {
    expect(page).toContain('"/product/"');
    expect(page).not.toMatch(/redirect\/deal|offer_url|amazon|tag=/i);
  });

  it("covers the search states", () => {
    for (const text of ["Searching...", "No products found", "This market is not available", "Search failed", "not valid", "No product found for that barcode"]) {
      expect(page).toContain(text);
    }
  });

  it("is not indexed (it is a tool, not a content page) and carries the disclosure", () => {
    expect(page).toContain('content="noindex,follow"');
    expect(page).toContain("GDN may earn a commission from qualifying purchases.");
  });
});

describe("Cloudflare Pages proxy", () => {
  it("only forwards GET requests and no credentials", () => {
    expect(proxy).toContain('method: "GET"');
    expect(proxy).not.toMatch(/authorization|cookie/i);
    expect(proxy).not.toMatch(/api\/v1/);
  });
});
