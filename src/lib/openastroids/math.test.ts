import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clamp, dist, wrapPosition } from "./math";

describe("math", () => {
  it("clamp bounds values", () => {
    assert.equal(clamp(5, 0, 10), 5);
    assert.equal(clamp(-1, 0, 10), 0);
    assert.equal(clamp(11, 0, 10), 10);
  });

  it("wrapPosition wraps across edges", () => {
    assert.deepEqual(wrapPosition({ x: -1, y: 50 }, 100, 100), { x: 99, y: 50 });
    assert.deepEqual(wrapPosition({ x: 100, y: 50 }, 100, 100), { x: 0, y: 50 });
    assert.deepEqual(wrapPosition({ x: 50, y: -1 }, 100, 100), { x: 50, y: 99 });
    assert.deepEqual(wrapPosition({ x: 50, y: 100 }, 100, 100), { x: 50, y: 0 });
    assert.deepEqual(wrapPosition({ x: 810, y: 50 }, 400, 300), { x: 10, y: 50 });
  });

  it("dist returns hypot distance", () => {
    assert.equal(dist({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
  });
});
