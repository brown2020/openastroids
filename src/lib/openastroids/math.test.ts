import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clamp, dist, segmentHitsCircle, sweptCircleHit, toroidalDist, wrapDelta, wrapPosition } from "./math";

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

  it("wrapDelta and toroidalDist use the short way around", () => {
    assert.equal(wrapDelta(10, 790, 800), -20);
    assert.equal(toroidalDist({ x: 10, y: 40 }, { x: 790, y: 40 }, 800, 600), 20);
  });

  it("segmentHitsCircle catches a pass through the origin and misses a parallel miss", () => {
    assert.equal(segmentHitsCircle({ x: -30, y: 0 }, { x: 30, y: 0 }, 10), true);
    assert.equal(segmentHitsCircle({ x: -30, y: 40 }, { x: 30, y: 40 }, 10), false);
  });

  it("sweptCircleHit detects a bullet that tunnels across an asteroid", () => {
    const hit = sweptCircleHit({
      a0: { x: 150, y: 100 },
      a1: { x: 150, y: 100 },
      b0: { x: 100, y: 100 },
      b1: { x: 200, y: 100 },
      radius: 20,
      width: 800,
      height: 600,
    });
    assert.equal(hit, true);
  });
});
