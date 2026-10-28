import type { Vec2 } from "./types";

/** Full circle in radians (2π) - prefer over Math.PI * 2 for clarity */
export const TAU = Math.PI * 2;

/**
 * Clamps a value between minimum and maximum bounds.
 * @param value - The value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Clamped value in range [min, max]
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function mul(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

export function fromAngle(angleRad: number): Vec2 {
  return { x: Math.cos(angleRad), y: Math.sin(angleRad) };
}

/**
 * Wraps a position to the opposite edge when it goes off-screen (toroidal topology).
 * This creates the classic Asteroids "wrap-around" effect.
 * @param pos - Current position
 * @param width - Canvas width
 * @param height - Canvas height
 * @returns Position wrapped to stay within canvas bounds
 */
export function wrapPosition(pos: Vec2, width: number, height: number): Vec2 {
  const x = ((pos.x % width) + width) % width;
  const y = ((pos.y % height) + height) % height;
  return { x, y };
}

export function dist(a: Vec2, b: Vec2) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Signed shortest delta from `from` to `to` on a wrapping axis. */
export function wrapDelta(from: number, to: number, size: number): number {
  if (!(size > 0)) return to - from;
  let delta = to - from;
  delta = ((delta % size) + size) % size;
  if (delta > size / 2) delta -= size;
  return delta;
}

/** Euclidean distance using the shortest wrap on each axis. */
export function toroidalDist(a: Vec2, b: Vec2, width: number, height: number): number {
  return Math.hypot(wrapDelta(a.x, b.x, width), wrapDelta(a.y, b.y, height));
}

/** True when the segment from p0 to p1 comes within `radius` of the origin. */
export function segmentHitsCircle(p0: Vec2, p1: Vec2, radius: number): boolean {
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const lengthSq = dx * dx + dy * dy;
  if (p0.x * p0.x + p0.y * p0.y <= radius * radius) return true;
  if (lengthSq <= 1e-12) return false;
  const t = Math.max(0, Math.min(1, -(p0.x * dx + p0.y * dy) / lengthSq));
  const cx = p0.x + t * dx;
  const cy = p0.y + t * dy;
  return cx * cx + cy * cy <= radius * radius;
}

/**
 * Swept circle test. `a` and `b` move from their start points to continuous
 * (unwrapped) end points. Separation uses the toroidal image of `b` nearest `a`.
 */
export function sweptCircleHit(opts: {
  a0: Vec2;
  a1: Vec2;
  b0: Vec2;
  b1: Vec2;
  radius: number;
  width: number;
  height: number;
}): boolean {
  const bx = opts.a0.x + wrapDelta(opts.a0.x, opts.b0.x, opts.width);
  const by = opts.a0.y + wrapDelta(opts.a0.y, opts.b0.y, opts.height);
  const start = { x: bx - opts.a0.x, y: by - opts.a0.y };
  const end = {
    x: opts.b1.x + (bx - opts.b0.x) - opts.a1.x,
    y: opts.b1.y + (by - opts.b0.y) - opts.a1.y,
  };
  return segmentHitsCircle(start, end, opts.radius);
}

export function randBetween(rng: () => number, min: number, max: number) {
  return min + (max - min) * rng();
}
