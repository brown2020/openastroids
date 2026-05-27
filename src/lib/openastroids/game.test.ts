import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createInitialState,
  resetGame,
  resizeState,
  startGame,
  step,
  togglePause,
} from "./game";
import type { Asteroid, GameState, InputState } from "./types";

const NO_INPUT: InputState = {
  isThrusting: false,
  rotateDir: 0,
  isFiring: false,
  isHyperspace: false,
};

function runningState(overrides: Partial<GameState> = {}): GameState {
  const base = createInitialState({ width: 800, height: 600, nowMs: 1000, seed: 42 });
  return startGame(
    {
      ...base,
      ...overrides,
      ship: { ...base.ship, ...overrides.ship },
    },
    1000,
  );
}

describe("game state transitions", () => {
  it("startGame moves ready to running", () => {
    const ready = createInitialState({ width: 800, height: 600, nowMs: 0, seed: 1 });
    assert.equal(ready.status, "ready");
    const running = startGame(ready, 10);
    assert.equal(running.status, "running");
  });

  it("togglePause switches running and paused", () => {
    const running = runningState();
    const paused = togglePause(running);
    assert.equal(paused.status, "paused");
    assert.equal(togglePause(paused).status, "running");
  });

  it("resetGame returns a fresh ready state", () => {
    const running = runningState({ score: 500, lives: 1, level: 4 });
    const reset = resetGame(running, 2000, 99);
    assert.equal(reset.status, "ready");
    assert.equal(reset.score, 0);
    assert.equal(reset.lives, 3);
    assert.equal(reset.level, 1);
  });
});

describe("step", () => {
  it("does not simulate when not running", () => {
    const ready = createInitialState({ width: 800, height: 600, nowMs: 0, seed: 1 });
    const asteroidCount = ready.asteroids.length;
    const { next } = step(ready, NO_INPUT, 16, 1);
    assert.equal(next.status, "ready");
    assert.equal(next.asteroids.length, asteroidCount);
    assert.equal(next.score, 0);
  });

  it("destroys at most one asteroid per bullet per frame", () => {
    const overlappingLarge: Asteroid = {
      id: "a1",
      pos: { x: 200, y: 200 },
      vel: { x: 0, y: 0 },
      angle: 0,
      spin: 0,
      radius: 52,
      size: 3,
      shape: Array.from({ length: 12 }, () => 1),
    };
    const state = runningState({
      nowMs: 1000,
      lastFrameMs: 990,
      score: 0,
      ship: {
        pos: { x: 400, y: 300 },
        vel: { x: 0, y: 0 },
        angle: 0,
        radius: 14,
        invincibleUntilMs: 0,
        canFireAtMs: 0,
      },
      bullets: [
        {
          id: "b1",
          pos: { x: 200, y: 200 },
          vel: { x: 0, y: 0 },
          radius: 2.5,
          bornAtMs: 900,
        },
      ],
      asteroids: [overlappingLarge, { ...overlappingLarge, id: "a2" }],
    });

    const { next } = step(state, NO_INPUT, 1000, 12345);
    assert.equal(next.score, 20, "only one large asteroid should award points");
  });
});

describe("resizeState", () => {
  it("wraps ship, bullets, and asteroids into new bounds", () => {
    const ready = createInitialState({ width: 800, height: 600, nowMs: 0, seed: 1 });
    const state: GameState = {
      ...ready,
      ship: { ...ready.ship, pos: { x: -10, y: 300 } },
      bullets: [{ id: "b1", pos: { x: 810, y: 50 }, vel: { x: 0, y: 0 }, radius: 2.5, bornAtMs: 0 }],
      asteroids: ready.asteroids.map((a, i) =>
        i === 0 ? { ...a, pos: { x: 400, y: 610 } } : a,
      ),
    };

    const resized = resizeState(state, 400, 300);
    assert.equal(resized.width, 400);
    assert.equal(resized.height, 300);
    assert.equal(resized.ship.pos.x, 390);
    assert.equal(resized.bullets[0]?.pos.x, 10);
    assert.equal(resized.asteroids[0]?.pos.y, 10);
  });
});
