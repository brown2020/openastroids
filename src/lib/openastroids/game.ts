import { TAU, add, clamp, dist, fromAngle, mul, randBetween, wrapPosition } from "./math";
import { createRng, id as rid, type Rng } from "./random";
import type {
  Asteroid,
  AsteroidSize,
  Bullet,
  Debris,
  GameState,
  InputState,
  Ship,
  StepResult,
  Vec2,
} from "./types";

// Ship physics constants - tuned for classic Asteroids feel
/** Ship collision radius in pixels */
const SHIP_RADIUS = 14;
/** Ship rotation speed in radians per second - allows ~1.37 full rotations/sec */
const SHIP_TURN_RATE = 4.6;
/** Ship thrust acceleration in pixels per second squared */
const SHIP_THRUST = 520;
/** Ship velocity decay per frame (0.985 = 1.5% friction) */
const SHIP_FRICTION = 0.985;
/** Maximum ship velocity in pixels per second */
const SHIP_MAX_SPEED = 560;

// Bullet physics constants
/** Bullet velocity in pixels per second */
const BULLET_SPEED = 820;
/** Bullet collision radius in pixels */
const BULLET_RADIUS = 2.5;
/** Minimum time between shots in milliseconds */
const BULLET_COOLDOWN_MS = 180;
/** Bullet lifespan in milliseconds before disappearing */
const BULLET_LIFETIME_MS = 900;
/** Maximum player bullets on screen at once (matches arcade original) */
const MAX_BULLETS_ON_SCREEN = 4;

// Asteroid physics constants
/** Base speed for asteroids in pixels per second (smaller asteroids move faster) */
const ASTEROID_BASE_SPEED = 70;
/** Large asteroid collision radius in pixels */
const ASTEROID_LARGE_RADIUS = 52;
/** Medium asteroid collision radius in pixels */
const ASTEROID_MED_RADIUS = 32;
/** Small asteroid collision radius in pixels */
const ASTEROID_SMALL_RADIUS = 18;

// Gameplay constants
/** Ship invincibility duration after spawning/respawning in milliseconds */
const SHIP_INVINCIBLE_MS = 1400;

// Scoring constants
/** Points awarded for destroying a large asteroid */
const SCORE_LARGE = 20;
/** Points awarded for destroying a medium asteroid */
const SCORE_MED = 50;
/** Points awarded for destroying a small asteroid */
const SCORE_SMALL = 100;

/** Ship debris lifespan in milliseconds */
const SHIP_DEBRIS_MS = 600;

/** Ship triangle wing angle offset (matches render.ts) */
const SHIP_WING_ANGLE = 2.45;

/** Starting number of lives */
const DEFAULT_LIVES = 3;

/** Score interval for awarding an extra life (matches arcade) */
export const EXTRA_LIFE_SCORE_INTERVAL = 10_000;

/**
 * Creates the initial game state with default values.
 * @param opts - Configuration options for initializing the game
 * @param opts.width - Canvas width in pixels
 * @param opts.height - Canvas height in pixels
 * @param opts.nowMs - Current timestamp in milliseconds
 * @param opts.seed - Optional RNG seed for deterministic asteroid generation
 * @returns A new game state ready to start
 */
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
    asteroidsDestroyed: 0,
    activeMs: 0,
    nextExtraLifeAt: EXTRA_LIFE_SCORE_INTERVAL,
    ship,
    bullets: [],
    asteroids: spawnAsteroids({ rng, width, height, level: 1, avoid: ship.pos }),
    explosions: [],
    debris: [],
    lastFrameMs: nowMs,
  };
  return state;
}

/**
 * Updates game state when canvas is resized, ensuring ship stays in bounds.
 * @param prev - Current game state
 * @param width - New canvas width
 * @param height - New canvas height
 * @returns Updated game state with new dimensions
 */
export function resizeState(prev: GameState, width: number, height: number): GameState {
  if (prev.width === width && prev.height === height) return prev;
  return {
    ...prev,
    width,
    height,
    ship: { ...prev.ship, pos: wrapPosition(prev.ship.pos, width, height) },
    bullets: prev.bullets.map((b) => ({ ...b, pos: wrapPosition(b.pos, width, height) })),
    asteroids: prev.asteroids.map((a) => ({ ...a, pos: wrapPosition(a.pos, width, height) })),
    debris: prev.debris.map((d) => ({
      ...d,
      a: wrapPosition(d.a, width, height),
      b: wrapPosition(d.b, width, height),
    })),
  };
}

/**
 * Transitions the game from ready/paused state to running state.
 * @param prev - Current game state
 * @param nowMs - Current timestamp
 * @returns Game state with status set to "running"
 */
export function startGame(prev: GameState, nowMs: number): GameState {
  if (prev.status === "running") return prev;
  return { ...prev, status: "running", startedAtMs: nowMs, nowMs, lastFrameMs: nowMs };
}

/**
 * Toggles game between running and paused states.
 * @param prev - Current game state
 * @returns Game state with toggled status
 */
export function togglePause(prev: GameState): GameState {
  if (prev.status === "running") return { ...prev, status: "paused" };
  if (prev.status === "paused") return { ...prev, status: "running" };
  return prev;
}

/**
 * Resets the game to initial state, preserving canvas dimensions.
 * @param prev - Current game state
 * @param nowMs - Current timestamp
 * @param seed - Optional RNG seed for deterministic generation
 * @returns Fresh game state
 */
export function resetGame(prev: GameState, nowMs: number, seed?: number): GameState {
  return createInitialState({ width: prev.width, height: prev.height, nowMs, seed });
}

/**
 * Advances the game simulation by one frame, handling all game logic:
 * - Physics integration (ship, bullets, asteroids)
 * - Collision detection (bullets vs asteroids, ship vs asteroids)
 * - Game state transitions (level advancement, game over)
 * - Input processing (movement, firing, hyperspace)
 *
 * @param prev - Current game state
 * @param input - Player input for this frame
 * @param nowMs - Current timestamp in milliseconds
 * @param seed - RNG seed for this frame (should be unique per frame)
 * @returns Result containing new game state and event flags
 */
export function step(prev: GameState, input: InputState, nowMs: number, seed: number): StepResult {
  const rng = createRng(seed);
  if (prev.status !== "running") {
    return { next: { ...prev, nowMs, lastFrameMs: nowMs }, didShipExplode: false, didLevelAdvance: false };
  }

  const dtMs = clamp(nowMs - prev.lastFrameMs, 0, 50);
  const dt = dtMs / 1000;

  let didShipExplode = false;
  let didLevelAdvance = false;

  const activeMs = prev.activeMs + dtMs;
  let asteroidsDestroyed = prev.asteroidsDestroyed;

  let ship = integrateShip(prev.ship, input, dt, prev);
  let bullets = integrateBullets(prev.bullets, dt, prev, nowMs);
  let asteroids = integrateAsteroids(prev.asteroids, dt, prev);
  let explosions = prev.explosions.filter((e) => nowMs - e.bornAtMs < e.durationMs);
  let debris = prev.debris.filter((d) => nowMs - d.bornAtMs < d.durationMs);

  // hyperspace (teleport) - adds risk: brief invincibility but velocity kept
  if (input.isHyperspace && nowMs >= ship.invincibleUntilMs) {
    ship = {
      ...ship,
      pos: { x: rng() * prev.width, y: rng() * prev.height },
      invincibleUntilMs: nowMs + 520,
    };
  }

  // ship firing — max 4 on screen; cooldown unchanged when at limit
  if (input.isFiring && nowMs >= ship.canFireAtMs && bullets.length < MAX_BULLETS_ON_SCREEN) {
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
    if (spentBullets.has(b.id)) continue;
    for (const a of asteroids) {
      if (hitAsteroids.has(a.id)) continue;
      if (dist(b.pos, a.pos) <= b.radius + a.radius) {
        hitAsteroids.add(a.id);
        spentBullets.add(b.id);
        const split = splitAsteroid(a, rng);
        spawnedAsteroids.push(...split.spawned);
        score += split.score;
        asteroidsDestroyed += 1;
        explosions = explosions.concat({
          id: rid(rng),
          pos: a.pos,
          bornAtMs: nowMs,
          durationMs: 320,
        });
        break;
      }
    }
  }

  bullets = bullets.filter((b) => !spentBullets.has(b.id));
  asteroids = asteroids.filter((a) => !hitAsteroids.has(a.id)).concat(spawnedAsteroids);

  let lives = prev.lives;
  let nextExtraLifeAt = prev.nextExtraLifeAt;
  ({ lives, nextExtraLifeAt } = applyScoreExtraLives(score, lives, nextExtraLifeAt));

  // collisions: ship vs asteroids
  const isInvincible = nowMs < ship.invincibleUntilMs;
  if (!isInvincible) {
    for (const a of asteroids) {
      if (dist(ship.pos, a.pos) <= ship.radius + a.radius) {
        didShipExplode = true;
        debris = debris.concat(spawnShipDebris(ship, rng, nowMs));
        const livesAfterHit = lives - 1;
        if (livesAfterHit <= 0) {
          return {
            next: {
              ...prev,
              status: "gameover",
              nowMs,
              lastFrameMs: nowMs,
              lives: 0,
              score,
              level: prev.level,
              asteroidsDestroyed,
              activeMs,
              nextExtraLifeAt,
              bullets: [],
              ship,
              asteroids,
              explosions,
              debris,
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
            lives: livesAfterHit,
            score,
            level: prev.level,
            asteroidsDestroyed,
            activeMs,
            nextExtraLifeAt,
            ship,
            bullets: [],
            asteroids,
            explosions,
            debris,
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
    debris,
    score,
    lives,
    nextExtraLifeAt,
    level,
    asteroidsDestroyed,
    activeMs,
  };
  return { next, didShipExplode, didLevelAdvance };
}

/** Formats active run time for HUD display (m:ss). */
export function formatRunTimeMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Awards +1 life for each 10k score threshold crossed since the last award. */
export function applyScoreExtraLives(
  score: number,
  lives: number,
  nextExtraLifeAt: number,
  interval: number = EXTRA_LIFE_SCORE_INTERVAL,
): { lives: number; nextExtraLifeAt: number; extraLivesGained: number } {
  let updatedLives = lives;
  let threshold = nextExtraLifeAt;
  let extraLivesGained = 0;
  while (score >= threshold) {
    updatedLives += 1;
    extraLivesGained += 1;
    threshold += interval;
  }
  return { lives: updatedLives, nextExtraLifeAt: threshold, extraLivesGained };
}

/** Spawns 6 outward-flying line segments from the ship triangle (testable, pure aside from rng). */
export function spawnShipDebris(ship: Ship, rng: Rng, nowMs: number): Debris[] {
  const nose = add(ship.pos, mul(fromAngle(ship.angle), ship.radius + 8));
  const left = add(ship.pos, mul(fromAngle(ship.angle + SHIP_WING_ANGLE), ship.radius));
  const right = add(ship.pos, mul(fromAngle(ship.angle - SHIP_WING_ANGLE), ship.radius));
  const center = ship.pos;

  const segments: [Vec2, Vec2][] = [
    [nose, left],
    [left, center],
    [center, right],
    [right, nose],
    [center, nose],
    [left, right],
  ];

  return segments.map(([a, b]) => {
    const kick = mul(fromAngle(randBetween(rng, 0, TAU)), randBetween(rng, 80, 220));
    return {
      id: rid(rng),
      a: { ...a },
      b: { ...b },
      vel: add(ship.vel, kick),
      bornAtMs: nowMs,
      durationMs: SHIP_DEBRIS_MS,
    };
  });
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
  const maxRetries = 50;
  for (let i = 0; i < count; i += 1) {
    let placed = false;
    for (let attempt = 0; attempt < maxRetries; attempt += 1) {
      const a = createAsteroid({
        rng: opts.rng,
        width: opts.width,
        height: opts.height,
        size: 3,
      });
      if (dist(a.pos, opts.avoid) >= 180) {
        out.push(a);
        placed = true;
        break;
      }
    }
    if (!placed) {
      out.push(createAsteroid({ rng: opts.rng, width: opts.width, height: opts.height, size: 3 }));
    }
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
