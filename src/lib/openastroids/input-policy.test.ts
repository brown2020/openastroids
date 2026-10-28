import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldIgnoreGameAction, shouldPreventGameKeyDefault, touchRotateDir } from "./input-policy";

describe("game key policy", () => {
  it("prevents page scroll only when focus is not on a control", () => {
    assert.equal(shouldPreventGameKeyDefault("Space", false), true);
    assert.equal(shouldPreventGameKeyDefault("ArrowLeft", false), true);
    assert.equal(shouldPreventGameKeyDefault("Space", true), false);
    assert.equal(shouldPreventGameKeyDefault("Enter", false), false);
    assert.equal(shouldPreventGameKeyDefault("KeyP", false), false);
  });

  it("lets Enter and Space activate a focused control", () => {
    assert.equal(shouldIgnoreGameAction("Enter", false, true), true);
    assert.equal(shouldIgnoreGameAction("Space", false, true), true);
    assert.equal(shouldIgnoreGameAction("Enter", false, false), false);
    assert.equal(shouldIgnoreGameAction("KeyP", false, true), false);
  });

  it("ignores repeat on pause, hyperspace, and start", () => {
    assert.equal(shouldIgnoreGameAction("KeyP", true, false), true);
    assert.equal(shouldIgnoreGameAction("ShiftLeft", true, false), true);
    assert.equal(shouldIgnoreGameAction("ShiftRight", true, false), true);
    assert.equal(shouldIgnoreGameAction("Enter", true, false), true);
    assert.equal(shouldIgnoreGameAction("KeyP", false, false), false);
    assert.equal(shouldIgnoreGameAction("Space", true, false), false);
  });
});

describe("touchRotateDir", () => {
  it("keeps the held direction when the other button is released", () => {
    assert.equal(touchRotateDir(true, false), -1);
    assert.equal(touchRotateDir(false, true), 1);
    assert.equal(touchRotateDir(true, true), 0);
    assert.equal(touchRotateDir(false, false), 0);
  });
});
