import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyScoreExtraLives,
  createInitialState,
  EXTRA_LIFE_SCORE_INTERVAL,
  resetGame,
  resizeState,
  spawnShipDebris,
  startGame,
  step,
  togglePause,
} from "./game";
import { dist } from "./math";
import { createRng } from "./random";
import type { Asteroid, GameState, InputState } from "./types";

const NO_INPUT: InputState = {
  isThrusting: false,
  rotateDir: 0,
  isFiring: false,
  isHyperspace: false,
};

function runningState(overrides: Partial<GameState> = {}): GameState {
  const nowMs = overrides.nowMs ?? 1000;
  const base = createInitialState({ width: 800, height: 600, nowMs, seed: 42 });
  const started = startGame(
    {
      ...base,
      ...overrides,
      ship: { ...base.ship, ...overrides.ship },
    },
    nowMs,
  );
  // startGame syncs lastFrameMs to nowMs; preserve an explicit delta for step() tests.
  if (overrides.lastFrameMs !== undefined) {
    return { ...started, lastFrameMs: overrides.lastFrameMs };
  }
  return started;
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
    const running = runningState({ score: 500, lives: 1, level: 4, nextExtraLifeAt: 30_000 });
    const reset = resetGame(running, 2000, 99);
    assert.equal(reset.status, "ready");
    assert.equal(reset.score, 0);
    assert.equal(reset.lives, 3);
    assert.equal(reset.level, 1);
    assert.equal(reset.nextExtraLifeAt, EXTRA_LIFE_SCORE_INTERVAL);
    assert.equal(reset.asteroidsDestroyed, 0);
    assert.equal(reset.activeMs, 0);
  });
});

describe("applyScoreExtraLives", () => {
  it("does not award a life below the threshold", () => {
    const result = applyScoreExtraLives(9999, 3, EXTRA_LIFE_SCORE_INTERVAL);
    assert.equal(result.lives, 3);
    assert.equal(result.nextExtraLifeAt, EXTRA_LIFE_SCORE_INTERVAL);
    assert.equal(result.extraLivesGained, 0);
  });

  it("awards one life at 10k and advances the threshold", () => {
    const result = applyScoreExtraLives(10_000, 3, EXTRA_LIFE_SCORE_INTERVAL);
    assert.equal(result.lives, 4);
    assert.equal(result.nextExtraLifeAt, 20_000);
    assert.equal(result.extraLivesGained, 1);
  });

  it("awards multiple lives when several thresholds are crossed at once", () => {
    const result = applyScoreExtraLives(25_000, 2, EXTRA_LIFE_SCORE_INTERVAL);
    assert.equal(result.lives, 4);
    assert.equal(result.nextExtraLifeAt, 30_000);
    assert.equal(result.extraLivesGained, 2);
  });

  it("does not re-award a threshold already passed", () => {
    const result = applyScoreExtraLives(12_000, 4, 20_000);
    assert.equal(result.lives, 4);
    assert.equal(result.nextExtraLifeAt, 20_000);
    assert.equal(result.extraLivesGained, 0);
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

  it("accumulates active time while running", () => {
    const state = runningState({ nowMs: 1000, lastFrameMs: 960, activeMs: 500 });
    const { next } = step(state, NO_INPUT, 1000, 1);
    assert.equal(next.activeMs, 540);
  });

  it("increments asteroids destroyed when a bullet hits", () => {
    const asteroid: Asteroid = {
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
      asteroidsDestroyed: 2,
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
      asteroids: [asteroid],
    });

    const { next, asteroidHits } = step(state, NO_INPUT, 1000, 12345);
    assert.equal(next.asteroidsDestroyed, 3);
    assert.equal(next.score, 20);
    assert.deepEqual(asteroidHits, [3]);
  });

  it("reports didFire when a bullet is created", () => {
    const state = runningState({
      nowMs: 1000,
      lastFrameMs: 990,
      ship: {
        pos: { x: 400, y: 300 },
        vel: { x: 0, y: 0 },
        angle: -Math.PI / 2,
        radius: 14,
        invincibleUntilMs: 99999,
        canFireAtMs: 0,
      },
      bullets: [],
    });

    const { next, didFire } = step(state, { ...NO_INPUT, isFiring: true }, 1000, 99);
    assert.equal(next.bullets.length, 1);
    assert.equal(didFire, true);
  });

  it("does not fire when four bullets are already on screen", () => {
    const bullets = Array.from({ length: 4 }, (_, i) => ({
      id: `b${i}`,
      pos: { x: 100 + i * 10, y: 100 },
      vel: { x: 0, y: 0 },
      radius: 2.5,
      bornAtMs: 900,
    }));
    const state = runningState({
      nowMs: 1000,
      lastFrameMs: 990,
      ship: {
        pos: { x: 400, y: 300 },
        vel: { x: 0, y: 0 },
        angle: 0,
        radius: 14,
        invincibleUntilMs: 99999,
        canFireAtMs: 0,
      },
      bullets,
    });

    const { next, didFire } = step(state, { ...NO_INPUT, isFiring: true }, 1000, 99);
    assert.equal(next.bullets.length, 4);
    assert.equal(didFire, false);
    assert.equal(next.ship.canFireAtMs, 0, "cooldown should not advance when at bullet limit");
  });

  it("fires when a bullet slot opens after expiry", () => {
    const expiredBullets = Array.from({ length: 4 }, (_, i) => ({
      id: `b${i}`,
      pos: { x: 100, y: 100 },
      vel: { x: 0, y: 0 },
      radius: 2.5,
      bornAtMs: 0,
    }));
    const state = runningState({
      nowMs: 1000,
      lastFrameMs: 990,
      ship: {
        pos: { x: 400, y: 300 },
        vel: { x: 0, y: 0 },
        angle: -Math.PI / 2,
        radius: 14,
        invincibleUntilMs: 99999,
        canFireAtMs: 0,
      },
      bullets: expiredBullets,
    });

    const { next } = step(state, { ...NO_INPUT, isFiring: true }, 1000, 99);
    assert.equal(next.bullets.length, 1);
    assert.equal(next.ship.canFireAtMs, 1180);
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

describe("spawnShipDebris", () => {
  it("spawns six segments with ship velocity and 600ms lifetime", () => {
    const ship = {
      pos: { x: 400, y: 300 },
      vel: { x: 12, y: -5 },
      angle: 0,
      radius: 14,
      invincibleUntilMs: 0,
      canFireAtMs: 0,
    };
    const debris = spawnShipDebris(ship, createRng(42), 1000);
    assert.equal(debris.length, 6);
    assert.ok(debris.every((d) => d.durationMs === 600));
    assert.ok(debris.every((d) => d.vel.x !== 0 || d.vel.y !== 0));
  });
});

describe("ship death debris", () => {
  it("adds debris on ship-asteroid collision without radial ship explosion", () => {
    const asteroid: Asteroid = {
      id: "a1",
      pos: { x: 400, y: 300 },
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
      lives: 2,
      ship: {
        pos: { x: 400, y: 300 },
        vel: { x: 0, y: 0 },
        angle: 0,
        radius: 14,
        invincibleUntilMs: 0,
        canFireAtMs: 0,
      },
      asteroids: [asteroid],
      debris: [],
    });

    const { next, didShipExplode } = step(state, NO_INPUT, 1000, 99);
    assert.equal(didShipExplode, true);
    assert.equal(next.debris.length, 6);
    assert.equal(next.explosions.length, 0);
    assert.equal(next.lives, 1);
  });
});

describe("wrapped and swept collisions", () => {
  it("hits an asteroid across the screen edge", () => {
    const state = runningState({
      nowMs: 1000,
      lastFrameMs: 984,
      lives: 2,
      asteroids: [
        {
          id: "edge",
          pos: { x: 790, y: 300 },
          vel: { x: 0, y: 0 },
          angle: 0,
          spin: 0,
          radius: 18,
          size: 1,
          shape: Array.from({ length: 12 }, () => 1),
        },
      ],
      ship: {
        pos: { x: 10, y: 300 },
        vel: { x: 0, y: 0 },
        angle: 0,
        radius: 14,
        invincibleUntilMs: 0,
        canFireAtMs: 0,
      },
      bullets: [],
    });
    const { didShipExplode } = step(state, NO_INPUT, 1000, 5);
    assert.equal(didShipExplode, true);
  });

  it("hits an asteroid a fast bullet passes through during the frame", () => {
    const state = runningState({
      nowMs: 1000,
      lastFrameMs: 950,
      score: 0,
      asteroids: [
        {
          id: "mid",
          pos: { x: 150, y: 100 },
          vel: { x: 0, y: 0 },
          angle: 0,
          spin: 0,
          radius: 18,
          size: 3,
          shape: Array.from({ length: 12 }, () => 1),
        },
      ],
      ship: {
        pos: { x: 400, y: 400 },
        vel: { x: 0, y: 0 },
        angle: 0,
        radius: 14,
        invincibleUntilMs: 99_999,
        canFireAtMs: 99_999,
      },
      bullets: [
        {
          id: "fast",
          pos: { x: 100, y: 100 },
          vel: { x: 2000, y: 0 },
          radius: 2.5,
          bornAtMs: 950,
        },
      ],
    });
    const { next, asteroidHits } = step(state, NO_INPUT, 1000, 8);
    assert.deepEqual(asteroidHits, [3]);
    assert.equal(next.score, 20);
    assert.equal(next.bullets.length, 0);
  });
});

describe("ship friction", () => {
  it("coasts at the same rate across frame rates", () => {
    const coast = (fps: number) => {
      let state = runningState({
        nowMs: 0,
        lastFrameMs: 0,
        asteroids: [],
        ship: {
          pos: { x: 400, y: 300 },
          vel: { x: 400, y: 0 },
          angle: 0,
          radius: 14,
          invincibleUntilMs: 1_000_000,
          canFireAtMs: 0,
        },
      });
      const dt = 1000 / fps;
      for (let i = 1; i <= fps; i += 1) {
        state = step(state, NO_INPUT, i * dt, i).next;
      }
      return state.ship.vel.x;
    };

    const at30 = coast(30);
    const at60 = coast(60);
    const at144 = coast(144);
    assert.ok(Math.abs(at30 - at60) < 0.01, `30fps ${at30} vs 60fps ${at60}`);
    assert.ok(Math.abs(at144 - at60) < 0.01, `144fps ${at144} vs 60fps ${at60}`);
    assert.ok(at60 < 400 && at60 > 100);
  });
});

describe("timers outside running", () => {
  it("keeps the spawn shield while the ready screen is up", () => {
    let ready = createInitialState({ width: 800, height: 600, nowMs: 0, seed: 1 });
    ready = step(ready, NO_INPUT, 5000, 1).next;
    const started = startGame(ready, 5000);
    assert.equal(started.ship.invincibleUntilMs - started.nowMs, 1400);
    const first = step(started, NO_INPUT, 5100, 2).next;
    assert.ok(first.nowMs < first.ship.invincibleUntilMs);
  });

  it("does not age invincibility, bullets, or fire cooldown while paused", () => {
    let state = runningState({
      nowMs: 1000,
      lastFrameMs: 1000,
      ship: {
        pos: { x: 400, y: 300 },
        vel: { x: 0, y: 0 },
        angle: 0,
        radius: 14,
        invincibleUntilMs: 2400,
        canFireAtMs: 1180,
      },
      bullets: [
        {
          id: "b1",
          pos: { x: 40, y: 40 },
          vel: { x: 0, y: 0 },
          radius: 2.5,
          bornAtMs: 1000,
        },
      ],
    });
    state = togglePause(state);
    state = step(state, NO_INPUT, 3000, 3).next;
    assert.equal(state.status, "paused");
    assert.equal(state.bullets.length, 1);
    assert.equal(state.ship.invincibleUntilMs - state.nowMs, 1400);
    assert.equal(state.ship.canFireAtMs - state.nowMs, 180);
    assert.equal(state.nowMs - state.bullets[0]!.bornAtMs, 0);

    const resumed = startGame(state, 3010);
    const next = step(resumed, NO_INPUT, 3026, 4).next;
    assert.equal(next.bullets.length, 1);
    assert.equal(next.ship.invincibleUntilMs, 4410);
    assert.ok(next.nowMs < next.ship.invincibleUntilMs);
    assert.equal(next.ship.canFireAtMs, 3190);
  });
});

describe("asteroid spawn clearance", () => {
  it("keeps the opening wave outside the 180px ship buffer on a normal field", () => {
    const state = createInitialState({ width: 800, height: 600, nowMs: 0, seed: 42 });
    assert.equal(state.asteroids.length, 4);
    assert.deepEqual(state.asteroids[0]?.pos, { x: 376.62553898990154, y: 502.40245554596186 });
    for (const asteroid of state.asteroids) {
      assert.ok(dist(asteroid.pos, state.ship.pos) >= 180);
    }
  });

  it("does not drop a large asteroid on the ship when the field is smaller than the buffer", () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const state = createInitialState({ width: 220, height: 220, nowMs: 0, seed });
      for (const asteroid of state.asteroids) {
        const gap = dist(asteroid.pos, state.ship.pos);
        assert.ok(
          gap > asteroid.radius + state.ship.radius,
          `seed ${seed} spawned ${gap.toFixed(1)}px from the ship`,
        );
      }
    }
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
