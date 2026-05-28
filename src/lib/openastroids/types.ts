export type Vec2 = { x: number; y: number };

export type InputState = {
  isThrusting: boolean;
  rotateDir: -1 | 0 | 1;
  isFiring: boolean;
  isHyperspace: boolean;
};

export type Ship = {
  pos: Vec2;
  vel: Vec2;
  angle: number; // radians, 0 points right
  radius: number;
  invincibleUntilMs: number;
  canFireAtMs: number;
};

export type Bullet = {
  id: string;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  bornAtMs: number;
};

export type AsteroidSize = 1 | 2 | 3; // 3=large, 2=medium, 1=small

export type Asteroid = {
  id: string;
  pos: Vec2;
  vel: Vec2;
  angle: number;
  spin: number;
  radius: number;
  size: AsteroidSize;
  shape: number[]; // normalized radial offsets per vertex
};

export type Explosion = {
  id: string;
  pos: Vec2;
  bornAtMs: number;
  durationMs: number;
};

/** Ship hull fragment — a line segment that flies outward after the ship is destroyed */
export type Debris = {
  id: string;
  a: Vec2;
  b: Vec2;
  vel: Vec2;
  bornAtMs: number;
  durationMs: number;
};

export type GameStatus = "ready" | "running" | "paused" | "gameover";

export type GameState = {
  status: GameStatus;
  width: number;
  height: number;
  startedAtMs: number;
  nowMs: number;
  lives: number;
  score: number;
  level: number;
  /** Asteroids destroyed by player bullets this run */
  asteroidsDestroyed: number;
  /** Active gameplay time accumulated while running (excludes pause), in ms */
  activeMs: number;
  /** Score at which the next bonus life is awarded (10k, 20k, …) */
  nextExtraLifeAt: number;
  ship: Ship;
  bullets: Bullet[];
  asteroids: Asteroid[];
  explosions: Explosion[];
  debris: Debris[];
  lastFrameMs: number;
};

export type StepResult = {
  next: GameState;
  didShipExplode: boolean;
  didLevelAdvance: boolean;
  /** True when a player bullet was created this frame */
  didFire: boolean;
  /** Sizes of asteroids destroyed by player bullets this frame */
  asteroidHits: AsteroidSize[];
  /** Bonus lives awarded from score thresholds this frame */
  extraLivesGained: number;
};
