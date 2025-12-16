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
  ship: Ship;
  bullets: Bullet[];
  asteroids: Asteroid[];
  explosions: Explosion[];
  lastFrameMs: number;
};

export type StepResult = {
  next: GameState;
  didShipExplode: boolean;
  didLevelAdvance: boolean;
};
