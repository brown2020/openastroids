import { TAU, add, fromAngle, mul, wrapPosition } from "./math";
import { createRng } from "./random";
import type { Asteroid, Debris, GameState, Ship, Vec2 } from "./types";

export type RenderOptions = {
  isCrt?: boolean;
  /** True while thrust input is held during running gameplay */
  isThrusting?: boolean;
  /** When true, thrust flame uses a static short line instead of flicker */
  prefersReducedMotion?: boolean;
};

/** Thrust exhaust length in pixels (pure helper for tests and rendering). */
export function thrustFlameLength(nowMs: number, animate: boolean): number {
  if (!animate) return 10;
  return 8 + 6 * Math.abs(Math.sin(nowMs * 0.04));
}

const SHIP_WING_ANGLE = 2.45;

export function render(ctx: CanvasRenderingContext2D, state: GameState, opts: RenderOptions = {}) {
  const { width, height } = state;
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // background
  ctx.fillStyle = "#05070a";
  ctx.fillRect(0, 0, width, height);

  // subtle stars
  drawStars(ctx, width, height);

  // vector styling
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(210, 255, 235, 0.9)";
  ctx.shadowColor = "rgba(75, 220, 170, 0.35)";
  ctx.shadowBlur = 10;

  // asteroids
  for (const a of state.asteroids) drawAsteroid(ctx, a);

  // bullets
  ctx.shadowBlur = 6;
  for (const b of state.bullets) {
    ctx.beginPath();
    ctx.arc(b.pos.x, b.pos.y, b.radius, 0, TAU);
    ctx.stroke();
  }

  // ship
  drawShip(ctx, state, opts);

  // ship debris (drawn after ship so fragments appear on top during breakup)
  for (const d of state.debris) drawDebris(ctx, d, state);

  // explosions
  for (const e of state.explosions) drawExplosion(ctx, e.pos, (state.nowMs - e.bornAtMs) / e.durationMs);

  if (opts.isCrt) drawCrtOverlay(ctx, width, height);

  ctx.restore();
}

function drawShip(ctx: CanvasRenderingContext2D, state: GameState, opts: RenderOptions) {
  const ship = state.ship;
  const isInvincible = state.nowMs < ship.invincibleUntilMs;
  const blink = isInvincible ? Math.floor((ship.invincibleUntilMs - state.nowMs) / 110) % 2 === 0 : false;

  if (blink) return;

  if (opts.isThrusting && state.status === "running") {
    drawThrustFlame(ctx, ship, state.nowMs, !opts.prefersReducedMotion);
  }

  const nose = add(ship.pos, mul(fromAngle(ship.angle), ship.radius + 8));
  const left = add(ship.pos, mul(fromAngle(ship.angle + SHIP_WING_ANGLE), ship.radius));
  const right = add(ship.pos, mul(fromAngle(ship.angle - SHIP_WING_ANGLE), ship.radius));

  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(nose.x, nose.y);
  ctx.lineTo(left.x, left.y);
  ctx.lineTo(ship.pos.x, ship.pos.y);
  ctx.lineTo(right.x, right.y);
  ctx.closePath();
  ctx.stroke();
}

function drawThrustFlame(ctx: CanvasRenderingContext2D, ship: Ship, nowMs: number, animate: boolean) {
  const length = thrustFlameLength(nowMs, animate);
  const wobble = animate ? 0.12 * Math.sin(nowMs * 0.03) : 0;
  const exhaustDir = fromAngle(ship.angle + Math.PI + wobble);
  const tail = add(ship.pos, mul(exhaustDir, length));

  ctx.save();
  ctx.shadowBlur = animate ? 8 : 4;
  ctx.strokeStyle = animate ? "rgba(210, 255, 235, 0.75)" : "rgba(210, 255, 235, 0.6)";
  ctx.beginPath();
  ctx.moveTo(ship.pos.x, ship.pos.y);
  ctx.lineTo(tail.x, tail.y);
  ctx.stroke();
  ctx.restore();
}

function drawDebris(ctx: CanvasRenderingContext2D, debris: Debris, state: GameState) {
  const elapsed = state.nowMs - debris.bornAtMs;
  const life = elapsed / debris.durationMs;
  if (life >= 1) return;

  const t = elapsed / 1000;
  const a = wrapPosition(add(debris.a, mul(debris.vel, t)), state.width, state.height);
  const b = wrapPosition(add(debris.b, mul(debris.vel, t)), state.width, state.height);

  ctx.save();
  ctx.globalAlpha = 1 - life;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
}

function drawAsteroid(ctx: CanvasRenderingContext2D, a: Asteroid) {
  const vCount = a.shape.length;
  const step = TAU / vCount;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  for (let i = 0; i < vCount; i += 1) {
    const ang = a.angle + i * step;
    const r = a.radius * (a.shape[i] ?? 1);
    const p = add(a.pos, mul(fromAngle(ang), r));
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.stroke();
}

function drawExplosion(ctx: CanvasRenderingContext2D, pos: Vec2, t01: number) {
  const t = Math.max(0, Math.min(1, t01));
  const rays = 10;
  const maxR = 40;
  const r = 6 + maxR * t;
  ctx.save();
  ctx.globalAlpha = 1 - t;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  for (let i = 0; i < rays; i += 1) {
    const ang = (i / rays) * TAU;
    const p = add(pos, mul(fromAngle(ang), r));
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.restore();
}

// Fixed seed for deterministic star generation (stars are decorative, don't need game seed)
const STAR_SEED = 0xdeadbeef;
let cachedStars: { w: number; h: number; stars: { x: number; y: number; a: number }[] } | null = null;

function drawStars(ctx: CanvasRenderingContext2D, width: number, height: number) {
  if (!cachedStars || cachedStars.w !== width || cachedStars.h !== height) {
    const rng = createRng(STAR_SEED);
    const count = Math.floor((width * height) / 12000);
    cachedStars = {
      w: width,
      h: height,
      stars: Array.from({ length: count }, () => ({
        x: rng() * width,
        y: rng() * height,
        a: 0.2 + rng() * 0.7,
      })),
    };
  }
  for (const s of cachedStars.stars) {
    ctx.fillStyle = `rgba(210,255,235,${s.a})`;
    ctx.fillRect(s.x, s.y, 1, 1);
  }
}

function drawCrtOverlay(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // scanlines
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#000";
  for (let y = 0; y < height; y += 3) ctx.fillRect(0, y, width, 1);
  ctx.restore();

  // vignette
  const g = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.25, width / 2, height / 2, Math.max(width, height) * 0.75);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}
