# CLAUDE.md - OpenAstroids

## Project Overview

OpenAstroids is a modern, open-source remake of the classic Asteroids arcade game built with Next.js and TypeScript. Features canvas-based vector graphics, keyboard/touch controls, and deterministic gameplay via seeded RNG.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, TypeScript 5
- **Styling:** Tailwind CSS 4
- **State:** Zustand (HUD state)
- **License:** AGPL-3.0

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main game component (client-side)
│   ├── layout.tsx         # Root layout with ErrorBoundary
│   └── globals.css        # Tailwind CSS imports
├── lib/openastroids/      # Core game logic (pure TypeScript, no React)
│   ├── types.ts           # Type definitions (Vec2, GameState, etc.)
│   ├── game.ts            # Main game loop & state management
│   ├── math.ts            # Vector math utilities
│   ├── render.ts          # Canvas rendering logic
│   └── random.ts          # Seeded RNG (Mulberry32)
├── stores/
│   └── openastroids-store.ts  # Zustand HUD state
└── components/
    └── error-boundary.tsx # Error boundary component
```

## Architecture

**Key principle:** Game logic is 100% decoupled from React.

- `/lib/openastroids/*` contains pure TypeScript functions with no React imports
- `/app/page.tsx` handles React hooks, event listeners, and component rendering
- Game state is immutable - `step()` returns new state objects
- Input handled via refs (not state) to avoid re-renders at 60fps

## Key Patterns

### Immutable State
```typescript
export function step(prev: GameState, ...): StepResult {
  const next: GameState = { ...prev, ship, bullets, asteroids, ... };
  return { next, didShipExplode, didLevelAdvance };
}
```

### Input via Refs
```typescript
const inputRef = useRef<InputState>({ ... });
inputRef.current.rotateDir = -1; // Direct mutation, no re-render
```

### Seeded RNG for Determinism
```typescript
const seed = (seedRef.current + frameRef.current) >>> 0;
const { next } = step(game, input, nowMs, seed);
```

### Component Memoization
```typescript
const GameButton = memo(function GameButton(props) { ... });
```

## Type Conventions

- `AsteroidSize`: 1 | 2 | 3 (small, medium, large)
- `GameStatus`: "ready" | "running" | "paused" | "gameover"
- `Vec2`: { x: number, y: number }

## Game Controls

**Desktop:** A/D or arrows (rotate), W or up (thrust), Space (fire), Shift (hyperspace), P (pause), Enter (start)

**Touch:** On-screen buttons for all actions
