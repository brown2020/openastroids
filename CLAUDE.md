# CLAUDE.md - OpenAstroids

## Project Overview

OpenAstroids is a browser-based Asteroids clone built with Next.js and TypeScript. It renders vector-style graphics on a canvas element, supports keyboard and touch input, and runs entirely client-side with no backend, no database, and no authentication.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, TypeScript 5
- **Styling:** Tailwind CSS 4
- **State:** Zustand 5 (HUD state bridge between game loop and React)
- **Build/Deploy:** Vercel
- **License:** AGPL-3.0

No Firebase, no database, no API routes, no server actions, no environment variables.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build (static export, 7 pages)
npm start        # Start production server
npm run lint     # Run ESLint
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main game page ("use client") — game loop, input, UI overlays
│   ├── layout.tsx            # Root layout — fonts, metadata, ErrorBoundary wrapper
│   ├── globals.css           # Tailwind imports, html/body reset
│   ├── about/page.tsx        # Static about page (Server Component)
│   ├── privacy/page.tsx      # Static privacy policy (Server Component)
│   └── terms/page.tsx        # Static terms of service (Server Component)
├── lib/openastroids/         # Core game engine (pure TypeScript, zero React imports)
│   ├── types.ts              # All type definitions
│   ├── game.ts               # Game state machine, physics, collision detection
│   ├── math.ts               # Vector math (add, mul, fromAngle, wrapPosition, dist, etc.)
│   ├── render.ts             # Canvas rendering (ship, asteroids, bullets, explosions, CRT overlay, stars)
│   └── random.ts             # Seeded PRNG (Mulberry32) and ID generation
├── stores/
│   └── openastroids-store.ts # Zustand store — bridges game state to React for HUD display
└── components/
    └── error-boundary.tsx    # React class component error boundary
```

## Architecture

**Game logic is 100% decoupled from React.** The `/lib/openastroids/` directory contains pure functions with no framework dependencies. React only handles mounting, input wiring, and HUD rendering.

**Game loop:** `requestAnimationFrame` drives a `tick()` function that calls `step()` (pure state transition) then `render()` (canvas draw). The loop runs at display refresh rate (~60fps). Game state lives in a `useRef` — never in React state — to avoid re-renders.

**HUD bridge:** The Zustand store receives HUD updates (score, lives, level, status) throttled to ~13fps via a 75ms interval. This is the only thing that triggers React re-renders during gameplay.

**Input:** Keyboard and touch input mutate a `useRef<InputState>` directly. Hyperspace is queued as a one-shot flag. No React state involved in the input path.

**Immutable state:** `step()` takes previous `GameState` and returns a new one. No mutation of game state objects.

## What the Game Currently Does

### Implemented
- Ship: rotation, thrust with inertia, friction, max speed, screen wrapping
- Firing: bullets travel forward from ship nose, have lifetime (900ms), wrap around screen
- Asteroids: 3 sizes (large/medium/small), split on hit (large→2 medium, medium→2 small, small→destroyed)
- Scoring: large=20, medium=50, small=100 (matches original arcade)
- Collision detection: bullets vs asteroids, ship vs asteroids (circle-circle)
- Lives: start with 3, lose one on collision, game over at 0
- Invincibility: 1.4s after spawn/respawn, ship blinks
- Hyperspace: random teleport with brief invincibility, risk of landing on asteroid
- Level progression: clearing all asteroids spawns a new wave with more asteroids
- Wave scaling: starts at ~4 large asteroids, increases with level, caps at 12
- Pause/resume: P key or button, auto-pause on tab visibility change
- Restart: generates new seed, resets entire game state
- Visual: vector-style line graphics, emerald/green glow, CRT scanline overlay, vignette, star field
- Accessibility: prefers-reduced-motion disables CRT effects, ARIA labels on touch buttons, focus indicators
- Touch controls: hold buttons for rotate/thrust/fire, tap button for hyperspace
- Responsive: canvas fills viewport, ResizeObserver adapts game dimensions, DPR capped at 2.5x
- Error boundary: catches React errors, shows reload button

### NOT Implemented
- **No flying saucers/UFOs** — the signature enemy from the original arcade game
- **No sound** — completely silent, no audio of any kind
- **No high score table** — scores are lost on page refresh
- **No extra lives** — no bonus life at score thresholds
- **No bullet limit** — can fire unlimited bullets (original allows max 4 on screen)
- **No thrust flame visual** — no exhaust effect when thrusting
- **No ship debris on death** — generic radial explosion, not the line-segment breakup from the original
- **No game-over stats** — just shows final score, no wave reached or other details

## Key Data Types

```typescript
GameState     // Full game snapshot: ship, bullets, asteroids, explosions, score, lives, level, status
Ship          // pos, vel, angle, radius, invincibleUntilMs, canFireAtMs
Bullet        // id, pos, vel, radius, bornAtMs
Asteroid      // id, pos, vel, angle, spin, radius, size (1|2|3), shape (vertex offsets)
Explosion     // id, pos, bornAtMs, durationMs
InputState    // isThrusting, rotateDir (-1|0|1), isFiring, isHyperspace
StepResult    // next GameState + didShipExplode + didLevelAdvance flags
GameStatus    // "ready" | "running" | "paused" | "gameover"
AsteroidSize  // 1 (small) | 2 (medium) | 3 (large)
Vec2          // { x: number, y: number }
```

## Game Constants

| Constant | Value | Notes |
|----------|-------|-------|
| SHIP_RADIUS | 14px | Collision radius |
| SHIP_TURN_RATE | 4.6 rad/s | ~1.37 full rotations/sec |
| SHIP_THRUST | 520 px/s² | Acceleration |
| SHIP_FRICTION | 0.985 | Per-frame velocity decay |
| SHIP_MAX_SPEED | 560 px/s | Velocity cap |
| BULLET_SPEED | 820 px/s | Added to ship velocity |
| BULLET_COOLDOWN_MS | 180ms | Min time between shots |
| BULLET_LIFETIME_MS | 900ms | Despawn after this |
| ASTEROID_BASE_SPEED | 70 px/s | Large asteroid base speed |
| SHIP_INVINCIBLE_MS | 1400ms | Post-spawn invincibility |
| DEFAULT_LIVES | 3 | Starting lives |

## Controls

**Desktop:** A/D or ←/→ (rotate), W or ↑ (thrust), Space (fire), Shift (hyperspace), P (pause), Enter (start/resume)

**Touch:** On-screen hold buttons for rotate/thrust/fire, tap button for hyperspace

## Pages

| Route | Type | Description |
|-------|------|-------------|
| `/` | Client Component | Main game |
| `/about` | Server Component | About page with game info and controls |
| `/privacy` | Server Component | Privacy policy (no data collected) |
| `/terms` | Server Component | Terms of service / license info |

## Known Limitations

- No audio whatsoever
- No persistent state across page loads
- Touch detection uses `ontouchstart`/`maxTouchPoints` which identifies touchscreen laptops as touch devices, hiding keyboard hints
- `spawnAsteroids` has a retry cap of 50 attempts to avoid ship proximity; on very small screens asteroids may spawn near the ship
- Explosion visual is generic radial lines, not authentic to the original
- No enemies besides asteroids — missing the core late-game challenge
