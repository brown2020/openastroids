import { TAU, add, fromAngle, mul } from "./math";
import type { Asteroid, GameState, Vec2 } from "./types";

export type RenderOptions = {
  isCrt?: boolean;
  pixelRatio?: number;
};

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
  drawShip(ctx, state);

  // explosions
  for (const e of state.explosions) drawExplosion(ctx, e.pos, (state.nowMs - e.bornAtMs) / e.durationMs);

  if (opts.isCrt) drawCrtOverlay(ctx, width, height);

  ctx.restore();
}

function drawShip(ctx: CanvasRenderingContext2D, state: GameState) {
  const ship = state.ship;
  const isInvincible = state.nowMs < ship.invincibleUntilMs;
  const blink = isInvincible ? Math.floor((ship.invincibleUntilMs - state.nowMs) / 110) % 2 === 0 : false;

  if (blink) return;

  const nose = add(ship.pos, mul(fromAngle(ship.angle), ship.radius + 8));
  const left = add(ship.pos, mul(fromAngle(ship.angle + 2.45), ship.radius));
  const right = add(ship.pos, mul(fromAngle(ship.angle - 2.45), ship.radius));

  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(nose.x, nose.y);
  ctx.lineTo(left.x, left.y);
  ctx.lineTo(ship.pos.x, ship.pos.y);
  ctx.lineTo(right.x, right.y);
  ctx.closePath();
  ctx.stroke();
}

function drawAsteroid(ctx: CanvasRenderingContext2D, a: Asteroid) {
  const vCount = a.shape.length;
  const step = TAU / vCount;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  for (let i = 0; i < vCount; i += 1) {
    const ang = a.angle + i * step;
    const r = a.radius * a.shape[i]!;
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

let cachedStars: { w: number; h: number; stars: { x: number; y: number; a: number }[] } | null = null;
function drawStars(ctx: CanvasRenderingContext2D, width: number, height: number) {
  if (!cachedStars || cachedStars.w !== width || cachedStars.h !== height) {
    const count = Math.floor((width * height) / 12000);
    cachedStars = {
      w: width,
      h: height,
      stars: Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        a: 0.2 + Math.random() * 0.7,
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


