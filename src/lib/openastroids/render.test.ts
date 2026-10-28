import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldDrawShip, thrustFlameLength } from "./render";

describe("shouldDrawShip", () => {
  it("hides the intact ship after game over", () => {
    assert.equal(shouldDrawShip("gameover"), false);
    assert.equal(shouldDrawShip("running"), true);
    assert.equal(shouldDrawShip("ready"), true);
    assert.equal(shouldDrawShip("paused"), true);
  });
});

describe("thrustFlameLength", () => {
  it("returns a fixed short length when animation is disabled", () => {
    assert.equal(thrustFlameLength(0, false), 10);
    assert.equal(thrustFlameLength(9999, false), 10);
  });

  it("varies length over time when animation is enabled", () => {
    const a = thrustFlameLength(0, true);
    const b = thrustFlameLength(250, true);
    assert.ok(a >= 8 && a <= 14);
    assert.ok(b >= 8 && b <= 14);
    assert.notEqual(a, b);
  });
});
