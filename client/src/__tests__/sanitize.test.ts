import { describe, expect, it } from "vitest";
import { getSafeExternalUrl, sanitizeJobDescriptionHtml } from "../lib/sanitize";

describe("sanitize utility", () => {
  describe("getSafeExternalUrl", () => {
    it("allows valid http and https URLs", () => {
      expect(getSafeExternalUrl("https://boards.greenhouse.io/stripe")).toBe(
        "https://boards.greenhouse.io/stripe",
      );
      expect(getSafeExternalUrl("http://example.com/jobs/1")).toBe(
        "http://example.com/jobs/1",
      );
    });

    it("rejects javascript, data, and malformed URLs", () => {
      expect(getSafeExternalUrl("javascript:alert(1)")).toBeNull();
      expect(getSafeExternalUrl("JAVASCRIPT:fetch('https://evil.test')")).toBeNull();
      expect(getSafeExternalUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
      expect(getSafeExternalUrl("not-a-url")).toBeNull();
      expect(getSafeExternalUrl("")).toBeNull();
      expect(getSafeExternalUrl(null)).toBeNull();
    });
  });

  describe("sanitizeJobDescriptionHtml", () => {
    it("strips script tags, event handlers, and dangerous elements", () => {
      const malicious =
        '<p>Role summary</p><script>alert("xss")</script><img src=x onerror="alert(1)"><iframe src="https://evil.test"></iframe>';
      const clean = sanitizeJobDescriptionHtml(malicious);

      expect(clean).toContain("<p>Role summary</p>");
      expect(clean.toLowerCase()).not.toContain("<script");
      expect(clean.toLowerCase()).not.toContain("onerror");
      expect(clean.toLowerCase()).not.toContain("<iframe");
      expect(clean.toLowerCase()).not.toContain("alert(");
    });

    it("decodes ATS-encoded HTML and sanitizes embedded payloads", () => {
      const encoded =
        "&lt;h3&gt;Requirements&lt;/h3&gt;&lt;ul&gt;&lt;li onclick=&quot;alert(1)&quot;&gt;TypeScript&lt;/li&gt;&lt;/ul&gt;&lt;script&gt;steal()&lt;/script&gt;";
      const clean = sanitizeJobDescriptionHtml(encoded);

      expect(clean).toContain("<h3>Requirements</h3>");
      expect(clean).toContain("<li>TypeScript</li>");
      expect(clean.toLowerCase()).not.toContain("onclick");
      expect(clean.toLowerCase()).not.toContain("<script");
      expect(clean.toLowerCase()).not.toContain("steal(");
    });

    it("sanitizes anchor hrefs to allow only http(s) links with safe rel/target", () => {
      const html =
        '<a href="https://stripe.com/jobs" onclick="evil()">Apply</a> <a href="javascript:alert(1)">Bad</a>';
      const clean = sanitizeJobDescriptionHtml(html);

      expect(clean).toContain(
        '<a href="https://stripe.com/jobs" target="_blank" rel="noopener noreferrer">Apply</a>',
      );
      expect(clean).not.toContain("javascript:");
      expect(clean).not.toContain("onclick");
    });
  });
});
