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

export function len(v: Vec2) {
  return Math.hypot(v.x, v.y);
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function mul(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

export function norm(v: Vec2): Vec2 {
  const l = len(v);
  if (l <= 1e-9) return { x: 0, y: 0 };
  return { x: v.x / l, y: v.y / l };
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
  let x = pos.x;
  let y = pos.y;
  if (x < 0) x += width;
  if (x >= width) x -= width;
  if (y < 0) y += height;
  if (y >= height) y -= height;
  return { x, y };
}

export function dist(a: Vec2, b: Vec2) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function randBetween(rng: () => number, min: number, max: number) {
  return min + (max - min) * rng();
}
