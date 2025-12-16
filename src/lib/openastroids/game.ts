import { TAU, add, clamp, dist, fromAngle, mul, randBetween, wrapPosition } from "./math";
import { createRng, id as rid, type Rng } from "./random";
import type {
  Asteroid,
  AsteroidSize,
  Bullet,
  GameState,
  InputState,
  Ship,
  StepResult,
  Vec2,
} from "./types";

const SHIP_RADIUS = 14;
const SHIP_TURN_RATE = 4.6; // rad/s
const SHIP_THRUST = 520; // px/s^2
const SHIP_FRICTION = 0.985;
const SHIP_MAX_SPEED = 560;

const BULLET_SPEED = 820;
const BULLET_RADIUS = 2.5;
const BULLET_COOLDOWN_MS = 180;
const BULLET_LIFETIME_MS = 900;

const ASTEROID_BASE_SPEED = 70;
const ASTEROID_LARGE_RADIUS = 52;
const ASTEROID_MED_RADIUS = 32;
const ASTEROID_SMALL_RADIUS = 18;

const SHIP_INVINCIBLE_MS = 1400;

const SCORE_LARGE = 20;
const SCORE_MED = 50;
const SCORE_SMALL = 100;

const DEFAULT_LIVES = 3;

export function createInitialState(opts: {
  width: number;
  height: number;
  nowMs: number;
  seed?: number;
}): GameState {
  const { width, height, nowMs } = opts;
  const seed = opts.seed ?? (nowMs ^ (width << 16) ^ height);
  const rng = createRng(seed);

  const ship = createFreshShip({ width, height, nowMs });
  const state: GameState = {
    status: "ready",
    width,
    height,
    startedAtMs: nowMs,
    nowMs,
    lives: DEFAULT_LIVES,
    score: 0,
    level: 1,
    ship,
    bullets: [],
    asteroids: spawnAsteroids({ rng, width, height, level: 1, avoid: ship.pos }),
    explosions: [],
    lastFrameMs: nowMs,
  };
  return state;
}

export function resizeState(prev: GameState, width: number, height: number): GameState {
  if (prev.width === width && prev.height === height) return prev;
  return { ...prev, width, height, ship: { ...prev.ship, pos: wrapPosition(prev.ship.pos, width, height) } };
}

export function startGame(prev: GameState, nowMs: number): GameState {
  if (prev.status === "running") return prev;
  return { ...prev, status: "running", startedAtMs: nowMs, nowMs, lastFrameMs: nowMs };
}

export function togglePause(prev: GameState): GameState {
  if (prev.status === "running") return { ...prev, status: "paused" };
  if (prev.status === "paused") return { ...prev, status: "running" };
  return prev;
}

export function resetGame(prev: GameState, nowMs: number, seed?: number): GameState {
  return createInitialState({ width: prev.width, height: prev.height, nowMs, seed });
}

export function step(prev: GameState, input: InputState, nowMs: number, seed: number): StepResult {
  const rng = createRng(seed);
  if (prev.status !== "running") {
    return { next: { ...prev, nowMs, lastFrameMs: nowMs }, didShipExplode: false, didLevelAdvance: false };
  }

  const dtMs = clamp(nowMs - prev.lastFrameMs, 0, 50);
  const dt = dtMs / 1000;

  let didShipExplode = false;
  let didLevelAdvance = false;

  let ship = integrateShip(prev.ship, input, dt, prev);
  let bullets = integrateBullets(prev.bullets, dt, prev, nowMs);
  let asteroids = integrateAsteroids(prev.asteroids, dt, prev);
  let explosions = prev.explosions.filter((e) => nowMs - e.bornAtMs < e.durationMs);

  // hyperspace (teleport) - adds risk: brief invincibility but velocity kept
  if (input.isHyperspace && nowMs >= ship.invincibleUntilMs) {
    ship = {
      ...ship,
      pos: { x: rng() * prev.width, y: rng() * prev.height },
      invincibleUntilMs: nowMs + 520,
    };
  }

  // ship firing
  if (input.isFiring && nowMs >= ship.canFireAtMs) {
    const dir = fromAngle(ship.angle);
    const muzzle = add(ship.pos, mul(dir, ship.radius + 8));
    bullets = bullets.concat({
      id: rid(rng),
      pos: muzzle,
      vel: add(ship.vel, mul(dir, BULLET_SPEED)),
      radius: BULLET_RADIUS,
      bornAtMs: nowMs,
    });
    ship = { ...ship, canFireAtMs: nowMs + BULLET_COOLDOWN_MS };
  }

  // collisions: bullets vs asteroids
  const hitAsteroids = new Set<string>();
  const spentBullets = new Set<string>();
  let score = prev.score;
  const spawnedAsteroids: Asteroid[] = [];

  for (const b of bullets) {
    for (const a of asteroids) {
      if (hitAsteroids.has(a.id)) continue;
      if (dist(b.pos, a.pos) <= b.radius + a.radius) {
        hitAsteroids.add(a.id);
        spentBullets.add(b.id);
        const split = splitAsteroid(a, rng);
        spawnedAsteroids.push(...split.spawned);
        score += split.score;
        explosions = explosions.concat({
          id: rid(rng),
          pos: a.pos,
          bornAtMs: nowMs,
          durationMs: 320,
        });
      }
    }
  }

  bullets = bullets.filter((b) => !spentBullets.has(b.id));
  asteroids = asteroids.filter((a) => !hitAsteroids.has(a.id)).concat(spawnedAsteroids);

  // collisions: ship vs asteroids
  const isInvincible = nowMs < ship.invincibleUntilMs;
  if (!isInvincible) {
    for (const a of asteroids) {
      if (dist(ship.pos, a.pos) <= ship.radius + a.radius) {
        didShipExplode = true;
        explosions = explosions.concat({
          id: rid(rng),
          pos: ship.pos,
          bornAtMs: nowMs,
          durationMs: 520,
        });
        const lives = prev.lives - 1;
        if (lives <= 0) {
          return {
            next: {
              ...prev,
              status: "gameover",
              nowMs,
              lastFrameMs: nowMs,
              lives: 0,
              score,
              bullets: [],
              ship,
              asteroids,
              explosions,
            },
            didShipExplode: true,
            didLevelAdvance: false,
          };
        }
        ship = createFreshShip({ width: prev.width, height: prev.height, nowMs, keepAngle: ship.angle });
        return {
          next: {
            ...prev,
            nowMs,
            lastFrameMs: nowMs,
            lives,
            score,
            ship,
            bullets: [],
            asteroids,
            explosions,
          },
          didShipExplode: true,
          didLevelAdvance: false,
        };
      }
    }
  }

  // level progression
  let level = prev.level;
  if (asteroids.length === 0) {
    didLevelAdvance = true;
    level += 1;
    asteroids = spawnAsteroids({ rng, width: prev.width, height: prev.height, level, avoid: ship.pos });
    ship = { ...ship, invincibleUntilMs: nowMs + SHIP_INVINCIBLE_MS };
  }

  const next: GameState = {
    ...prev,
    nowMs,
    lastFrameMs: nowMs,
    ship,
    bullets,
    asteroids,
    explosions,
    score,
    level,
  };
  return { next, didShipExplode, didLevelAdvance };
}

function integrateShip(ship: Ship, input: InputState, dt: number, game: GameState): Ship {
  let angle = ship.angle + input.rotateDir * SHIP_TURN_RATE * dt;
  angle = ((angle % TAU) + TAU) % TAU;

  let vel = ship.vel;
  if (input.isThrusting) {
    const a = fromAngle(angle);
    vel = add(vel, mul(a, SHIP_THRUST * dt));
  }

  vel = mul(vel, SHIP_FRICTION);
  const speed = Math.hypot(vel.x, vel.y);
  if (speed > SHIP_MAX_SPEED) {
    vel = mul(vel, SHIP_MAX_SPEED / speed);
  }

  let pos = add(ship.pos, mul(vel, dt));
  pos = wrapPosition(pos, game.width, game.height);

  return {
    ...ship,
    angle,
    vel,
    pos,
    // keep invincibility + firing timers
    invincibleUntilMs: ship.invincibleUntilMs,
    canFireAtMs: ship.canFireAtMs,
  };
}

function integrateBullets(bullets: Bullet[], dt: number, game: GameState, nowMs: number): Bullet[] {
  return bullets
    .filter((b) => nowMs - b.bornAtMs < BULLET_LIFETIME_MS)
    .map((b) => {
      const pos = wrapPosition(add(b.pos, mul(b.vel, dt)), game.width, game.height);
      return { ...b, pos };
    });
}

function integrateAsteroids(asteroids: Asteroid[], dt: number, game: GameState): Asteroid[] {
  return asteroids.map((a) => {
    const pos = wrapPosition(add(a.pos, mul(a.vel, dt)), game.width, game.height);
    const angle = ((a.angle + a.spin * dt) % TAU + TAU) % TAU;
    return { ...a, pos, angle };
  });
}

function createFreshShip(opts: { width: number; height: number; nowMs: number; keepAngle?: number }): Ship {
  return {
    pos: { x: opts.width / 2, y: opts.height / 2 },
    vel: { x: 0, y: 0 },
    angle: opts.keepAngle ?? -Math.PI / 2,
    radius: SHIP_RADIUS,
    invincibleUntilMs: opts.nowMs + SHIP_INVINCIBLE_MS,
    canFireAtMs: opts.nowMs,
  };
}

function spawnAsteroids(opts: {
  rng: Rng;
  width: number;
  height: number;
  level: number;
  avoid: Vec2;
}): Asteroid[] {
  const count = Math.min(4 + Math.floor(opts.level * 0.75), 12);
  const out: Asteroid[] = [];
  for (let i = 0; i < count; i += 1) {
    const a = createAsteroid({
      rng: opts.rng,
      width: opts.width,
      height: opts.height,
      size: 3,
    });
    // keep initial wave away from ship
    if (dist(a.pos, opts.avoid) < 180) {
      i -= 1;
      continue;
    }
    out.push(a);
  }
  return out;
}

function sizeToRadius(size: AsteroidSize) {
  if (size === 3) return ASTEROID_LARGE_RADIUS;
  if (size === 2) return ASTEROID_MED_RADIUS;
  return ASTEROID_SMALL_RADIUS;
}

function createAsteroid(opts: { rng: Rng; width: number; height: number; size: AsteroidSize; at?: Vec2 }): Asteroid {
  const radius = sizeToRadius(opts.size);
  const pos = opts.at ?? { x: opts.rng() * opts.width, y: opts.rng() * opts.height };
  const base = ASTEROID_BASE_SPEED + (3 - opts.size) * 28;
  const speed = randBetween(opts.rng, base * 0.75, base * 1.4);
  const dir = fromAngle(randBetween(opts.rng, 0, TAU));
  const vel = mul(dir, speed);

  const vertexCount = 12;
  const shape: number[] = Array.from({ length: vertexCount }, () => randBetween(opts.rng, 0.72, 1.18));

  return {
    id: rid(opts.rng),
    pos,
    vel,
    angle: randBetween(opts.rng, 0, TAU),
    spin: randBetween(opts.rng, -1.4, 1.4),
    radius,
    size: opts.size,
    shape,
  };
}

function splitAsteroid(asteroid: Asteroid, rng: Rng): { spawned: Asteroid[]; score: number } {
  if (asteroid.size === 3) {
    return {
      spawned: [
        createAsteroid({ rng, width: 1, height: 1, size: 2, at: jitter(asteroid.pos, rng, 16) }),
        createAsteroid({ rng, width: 1, height: 1, size: 2, at: jitter(asteroid.pos, rng, 16) }),
      ].map((a) => nudgeVelocity(a, asteroid.vel, rng)),
      score: SCORE_LARGE,
    };
  }
  if (asteroid.size === 2) {
    return {
      spawned: [
        createAsteroid({ rng, width: 1, height: 1, size: 1, at: jitter(asteroid.pos, rng, 10) }),
        createAsteroid({ rng, width: 1, height: 1, size: 1, at: jitter(asteroid.pos, rng, 10) }),
      ].map((a) => nudgeVelocity(a, asteroid.vel, rng)),
      score: SCORE_MED,
    };
  }
  return { spawned: [], score: SCORE_SMALL };
}

function jitter(pos: Vec2, rng: Rng, amount: number): Vec2 {
  return { x: pos.x + randBetween(rng, -amount, amount), y: pos.y + randBetween(rng, -amount, amount) };
}

function nudgeVelocity(a: Asteroid, parentVel: Vec2, rng: Rng): Asteroid {
  const kick = mul(fromAngle(randBetween(rng, 0, TAU)), randBetween(rng, 30, 120));
  return { ...a, vel: add(parentVel, add(a.vel, kick)) };
}


