import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AUDIO_MUTE_STORAGE_KEY,
  parseMutedPreference,
  readMutedPreference,
  writeMutedPreference,
} from "./audio";

describe("parseMutedPreference", () => {
  it("returns false for null or invalid values", () => {
    assert.equal(parseMutedPreference(null), false);
    assert.equal(parseMutedPreference(""), false);
    assert.equal(parseMutedPreference("0"), false);
    assert.equal(parseMutedPreference("no"), false);
  });

  it("returns true for stored mute flags", () => {
    assert.equal(parseMutedPreference("1"), true);
    assert.equal(parseMutedPreference("true"), true);
  });
});

describe("mute preference storage", () => {
  it("reads and writes via local storage key", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    };

    assert.equal(readMutedPreference(storage), false);
    writeMutedPreference(true, storage);
    assert.equal(store.get(AUDIO_MUTE_STORAGE_KEY), "1");
    assert.equal(readMutedPreference(storage), true);
    writeMutedPreference(false, storage);
    assert.equal(readMutedPreference(storage), false);
  });
});
