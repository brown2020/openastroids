import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatRunTimeMs } from "./game";

describe("formatRunTimeMs", () => {
  it("formats minutes and zero-padded seconds", () => {
    assert.equal(formatRunTimeMs(0), "0:00");
    assert.equal(formatRunTimeMs(59_999), "0:59");
    assert.equal(formatRunTimeMs(60_000), "1:00");
    assert.equal(formatRunTimeMs(125_000), "2:05");
  });

  it("never returns negative components", () => {
    assert.equal(formatRunTimeMs(-1000), "0:00");
  });
});
