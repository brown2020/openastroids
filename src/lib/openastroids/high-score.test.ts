import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HIGH_SCORE_STORAGE_KEY,
  maybeUpdateHighScore,
  parseHighScore,
  readHighScore,
  writeHighScore,
} from "./high-score";

function mockStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => (data.has(key) ? data.get(key)! : null),
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    snapshot: () => Object.fromEntries(data),
  };
}

describe("parseHighScore", () => {
  it("returns 0 for null or invalid values", () => {
    assert.equal(parseHighScore(null), 0);
    assert.equal(parseHighScore(""), 0);
    assert.equal(parseHighScore("abc"), 0);
    assert.equal(parseHighScore("-5"), 0);
  });

  it("parses non-negative integers", () => {
    assert.equal(parseHighScore("0"), 0);
    assert.equal(parseHighScore("1250"), 1250);
  });
});

describe("high score storage", () => {
  it("reads and writes via local storage key", () => {
    const storage = mockStorage();
    assert.equal(readHighScore(storage), 0);
    writeHighScore(420, storage);
    assert.equal(storage.snapshot()[HIGH_SCORE_STORAGE_KEY], "420");
    assert.equal(readHighScore(storage), 420);
  });

  it("maybeUpdateHighScore only increases the record", () => {
    const storage = mockStorage({ [HIGH_SCORE_STORAGE_KEY]: "100" });
    assert.equal(maybeUpdateHighScore(50, storage), 100);
    assert.equal(maybeUpdateHighScore(150, storage), 150);
    assert.equal(readHighScore(storage), 150);
  });
});
