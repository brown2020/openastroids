# AGENTS.md — OpenAstroids

Single source of truth for autonomous and human agents working in this repository.

## Project overview

OpenAstroids is a browser-based Asteroids clone: vector-style canvas graphics, keyboard and touch controls, entirely client-side. No backend, database, authentication, API routes, server actions, or environment variables.

**Product purpose:** Deliver a fast, playable, open-source Asteroids experience in the browser with modern UX (pause, mobile touch, accessibility) while staying faithful to core arcade mechanics.

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript 6 |
| Styling | Tailwind CSS 4 |
| HUD state | Zustand 5 |
| Package manager | **npm** (`package-lock.json` — do not switch to yarn/pnpm/bun) |
| Deploy target | Vercel (inferred from README; no IaC in repo) |
| License | AGPL-3.0 |

## Repository structure

```
src/
├── app/
│   ├── page.tsx              # Main game — client component, game loop, input, overlays
│   ├── layout.tsx            # Root layout, fonts, ErrorBoundary
│   ├── globals.css           # Tailwind imports, body reset
│   ├── about/page.tsx        # Static about (Server Component)
│   ├── privacy/page.tsx      # Privacy policy (Server Component)
│   └── terms/page.tsx        # Terms / license (Server Component)
├── lib/openastroids/         # Pure game engine — zero React imports
│   ├── types.ts              # All game types
│   ├── game.ts               # State machine, physics, collisions, spawning
│   ├── math.ts               # Vec2 math, wrapPosition, dist
│   ├── render.ts             # Canvas rendering, CRT overlay, stars
│   └── random.ts             # Mulberry32 PRNG, entity IDs
├── stores/
│   └── openastroids-store.ts # Zustand — HUD bridge only
└── components/
    └── error-boundary.tsx    # React error boundary with reload UI
```

Root docs: `AGENTS.md` (this file), `spec.md` (product spec and roadmap), `README.md` (getting started), `CLAUDE.md` (pointer to this file).

## Core architecture

```
Browser input (keyboard/touch)
        ↓
  inputRef (useRef) — no React state on hot path
        ↓
  step(prev, input, nowMs, seed)  ← pure, immutable
        ↓
  gameRef (useRef<GameState>)
        ↓
  render(ctx, state)              ← pure canvas draw
        ↓
  setHud (Zustand, ~13 fps)       ← only React re-renders during play
```

**Game loop:** `requestAnimationFrame` in `src/app/page.tsx` calls `step()` then `render()` every frame (~60 fps). Game state lives in `useRef`, never in React state.

**Immutability:** `step()` returns a new `GameState`; do not mutate entities in place.

**Seeding:** `crypto.getRandomValues` seeds the run; per-frame seed is `(seedRef + frameCount) >>> 0` for deterministic RNG via Mulberry32.

**Resize:** `ResizeObserver` resizes canvas; DPR capped at 2.5×; `resizeState()` wraps ship position.

## Key features that exist today

- Ship: rotation, thrust, inertia, friction, max speed, screen wrap
- Bullets: forward from ship nose, 900 ms lifetime, screen wrap, 180 ms cooldown — **no max-on-screen limit**
- Asteroids: 3 sizes, split on hit (20/50/100 pts), unique polygon shapes
- Lives: 3 starting; invincibility 1.4 s after spawn/respawn with blink
- Hyperspace: random teleport, brief invincibility, can collide on landing
- Levels: clearing asteroids spawns next wave (4 + level scaling, cap 12 large)
- Pause/resume (P, button); auto-pause on tab hidden; restart with new seed
- Visual: emerald vector lines, glow, star field, CRT scanlines/vignette (disabled when `prefers-reduced-motion`)
- Touch: hold buttons for rotate/thrust/fire, tap for hyperspace
- Static pages: `/about`, `/privacy`, `/terms`
- Error boundary with reload

## Important commands

```bash
npm run dev      # Dev server at http://localhost:3000
npm run build    # Production build
npm start        # Serve production build
npm run lint     # ESLint (eslint-config-next)
npm run typecheck # Typecheck
npm run test      # Unit tests (node:test + tsx)
```

## Canonical validation

Run before committing code changes:

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

There is **no test suite** and no `npm test` script. Do not add watch-mode or interactive commands in autonomous runs.

## Non-interactive testing rules

- Never wait for user input.
- Never use watch mode (`--watch`, `next dev` for validation).
- Never use a headed browser or manual login.
- Use CI-safe, exit-on-complete commands only.

## Development conventions

- **Scope:** One focused, PR-sized change per autonomous run — even when committing directly to `dev`.
- **Engine purity:** Game logic belongs in `src/lib/openastroids/`. No React imports there.
- **React boundaries:** Keep the game loop and input in `page.tsx` refs; use Zustand only for HUD fields consumed by overlays.
- **Constants:** Tune gameplay in `game.ts` (documented at top of file).
- **Styling:** Tailwind utility classes; match emerald-on-black aesthetic.
- **Paths:** Use `@/` alias for `src/`.
- **Comments:** Only for non-obvious logic; existing files use JSDoc on exported engine functions.
- **Generated files:** Do not edit `.next/`, `next-env.d.ts`, or lockfile unless dependencies change.

## TypeScript and lint expectations

- `strict: true` in `tsconfig.json`
- ESLint: `eslint-config-next` (core-web-vitals + typescript flat config)
- Fix lint and type errors introduced by your change
- Prefer explicit types on public engine exports

## Server / client boundary

| Route | Type | Notes |
|-------|------|-------|
| `/` | Client (`"use client"`) | Canvas, game loop, input |
| `/about`, `/privacy`, `/terms` | Server Components | Static content, metadata |
| `layout.tsx` | Server | Wraps children in client `ErrorBoundary` |

There are no API routes (`app/api/`), no Server Actions, and no middleware. All gameplay is client-side.

## Route protection

Not applicable. No authentication or protected routes.

## State management

- **Gameplay state:** `gameRef` in `page.tsx` — authoritative during play
- **Input:** `inputRef` + `queuedHyperspaceRef` — mutated directly for performance
- **HUD:** `useOpenAstroidsStore` — `status`, `score`, `lives`, `level`, `isTouch`; updated every 75 ms or on game-over
- Do not move game state into React `useState` or Zustand

## Testing expectations

No automated tests exist. Manual smoke test after gameplay changes:

1. `npm run dev` — page loads, canvas renders
2. Start game — ship moves, fires, asteroids split
3. Pause/resume, game over, restart
4. Resize window — canvas adapts
5. Touch controls on mobile or device emulation

When adding engine logic, prefer pure functions in `game.ts`/`math.ts` that could be unit-tested later; do not block on test infrastructure unless requested.

## Files and systems requiring extra caution

| File | Risk |
|------|------|
| `src/lib/openastroids/game.ts` | Physics, collisions, scoring, level progression — regressions are subtle |
| `src/app/page.tsx` | rAF loop timing, input edge cases, HUD sync |
| `src/lib/openastroids/render.ts` | Canvas performance; star cache keyed on dimensions |
| `src/lib/openastroids/types.ts` | Breaking changes ripple through engine and HUD |
| `src/app/privacy/page.tsx` | Claims about local storage — **no localStorage is implemented yet** (see `spec.md`) |

Do not add backend services, env vars, or auth without an explicit product decision in `spec.md`.

## Git workflow

| Branch | Role |
|--------|------|
| `main` | Stable production — **never push directly from autonomous runs** |
| `dev` | Autonomous working branch — commit and push here |

Before work: `git fetch origin && git checkout dev && git pull origin dev`

Do not create feature branches unless explicitly requested. Do not open PRs unless explicitly requested.

## Definition of done

A change is done when:

1. It matches the requested scope (one focused increment)
2. `npm run lint && npm run typecheck && npm run test && npm run build` pass
3. Manual smoke test criteria met for gameplay/UI changes
4. `spec.md` updated if product behavior or roadmap status changed
5. Committed to `dev` with a clear message; pushed to `origin/dev` when requested

## Rules for autonomous Codex runs

1. Read `AGENTS.md` and `spec.md` before editing.
2. Sync `dev` from remote before starting.
3. Inspect the working tree; stop and report if unexpected uncommitted changes exist.
4. Infer behavior from code, not stale docs.
5. One PR-sized change per run.
6. Use npm only; respect existing patterns.
7. Do not push to `main`, merge to `main`, or open PRs unless explicitly asked.
8. Do not implement roadmap items beyond the current task scope.

## Stop conditions

Stop and report (do not guess or overwrite) when:

- Uncommitted changes exist that are not yours and are not clearly safe to preserve
- `git pull` produces conflicts you cannot resolve confidently
- Validation fails for reasons outside your change and fixing requires large unrelated work
- The task requires backend/auth/database infrastructure that does not exist
- Instructions conflict with `spec.md` product direction — ask for clarification

## Product planning

See **`spec.md`** for feature inventory, known gaps, and the ordered product roadmap. Do not maintain competing planning docs.

## Key types (quick reference)

```typescript
GameState   // ship, bullets, asteroids, explosions, score, lives, level, status
GameStatus  // "ready" | "running" | "paused" | "gameover"
InputState  // isThrusting, rotateDir, isFiring, isHyperspace
StepResult  // next GameState, didShipExplode, didLevelAdvance
```

## Controls

**Desktop:** A/D or ←/→ rotate, W/↑ thrust, Space fire, Shift hyperspace, P pause, Enter start/resume

**Touch:** On-screen hold/tap buttons (shown when `ontouchstart` or `maxTouchPoints > 0`)
