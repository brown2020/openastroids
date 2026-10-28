import assert from "node:assert/strict";
import { describe, it } from "node:test";
import nextConfig from "../../../next.config.ts";

describe("security headers", () => {
  it("sets nosniff, a strict referrer policy, and frame-ancestors none", async () => {
    assert.equal(typeof nextConfig.headers, "function");
    const groups = await nextConfig.headers();
    const headers = new Map(
      groups.flatMap((group) => group.headers.map((header) => [header.key.toLowerCase(), header.value])),
    );

    assert.equal(headers.get("x-content-type-options"), "nosniff");
    assert.equal(headers.get("referrer-policy"), "strict-origin-when-cross-origin");
    assert.equal(headers.get("x-frame-options"), "DENY");
    const csp = headers.get("content-security-policy") ?? "";
    assert.match(csp, /frame-ancestors 'none'/);
    assert.match(csp, /object-src 'none'/);
    assert.match(csp, /base-uri 'self'/);
    assert.equal(
      groups.every((group) => group.source === "/:path*"),
      true,
    );
  });
});
