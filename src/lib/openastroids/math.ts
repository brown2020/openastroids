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

export function randBetween(rng: () => number, min: number, max: number) {
  return min + (max - min) * rng();
}
