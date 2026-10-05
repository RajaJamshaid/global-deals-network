import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  escapeXml,
  formatMoney,
  isHttpUrl,
  jsonLdScript,
  truncate,
} from "../../src/seo/html.js";

describe("escapeHtml", () => {
  it("escapes the five HTML-significant characters", () => {
    expect(escapeHtml(`<a href="x" onclick='y'>&</a>`)).toBe(
      "&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;",
    );
  });

  it("leaves plain text alone", () => {
    expect(escapeHtml("iPhone 16 128GB")).toBe("iPhone 16 128GB");
  });
});

describe("jsonLdScript", () => {
  it("cannot be broken out of with </script> or HTML comments", () => {
    const nasty = { name: "</script><script>alert(1)</script><!-- & \u2028" };
    const tag = jsonLdScript(nasty);
    const inner = tag.slice('<script type="application/ld+json">'.length, -"</script>".length);
    expect(inner).not.toContain("<");
    expect(inner).not.toContain(">");
    expect(inner).not.toContain("&");
    // The data survives intact once parsed.
    expect(JSON.parse(inner)).toEqual(nasty);
    // Exactly one script element: the closing tag we added.
    expect(tag.match(/<\/script>/g)).toHaveLength(1);
  });
});

describe("truncate", () => {
  it("collapses whitespace and shortens with an ellipsis", () => {
    expect(truncate("  a   b \n c  ", 50)).toBe("a b c");
    const long = truncate("x".repeat(100), 20);
    expect(long).toHaveLength(20);
    expect(long.endsWith("\u2026")).toBe(true);
  });
});

describe("formatMoney", () => {
  it("always shows the currency code and two decimals", () => {
    expect(formatMoney(94.9, "USD")).toBe("USD 94.90");
    expect(formatMoney(1200, "AED")).toBe("AED 1200.00");
  });
});

describe("isHttpUrl", () => {
  it("accepts only absolute http(s) URLs", () => {
    expect(isHttpUrl("https://cdn.example.com/a.png")).toBe(true);
    expect(isHttpUrl("http://cdn.example.com/a.png")).toBe(true);
    for (const bad of ["javascript:alert(1)", "data:text/html,x", "/relative.png", "ftp://x/y", "", null, undefined, "not a url"]) {
      expect(isHttpUrl(bad as string | null | undefined)).toBe(false);
    }
  });
});

describe("escapeXml", () => {
  it("escapes XML special characters", () => {
    expect(escapeXml(`a&b<c>"d'`)).toBe("a&amp;b&lt;c&gt;&quot;d&apos;");
  });
});
