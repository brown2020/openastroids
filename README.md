# OpenAstroids

A modern, open-source Asteroids clone for the browser: vector-style canvas graphics, keyboard and touch controls, entirely client-side. No backend, auth, API routes, or environment variables. Play at [https://openastroids.vercel.app](https://openastroids.vercel.app).

## Features

- Classic arcade loop: rotate, thrust, fire, hyperspace, asteroid splitting, lives, scoring
- Canvas renderer with CRT-style overlay and starfield
- Desktop keyboard controls and on-screen touch controls
- Pause, mute, high score (local-only), game-over / ready overlays
- Pure TypeScript game engine (`src/lib/openastroids`) separate from React HUD (Zustand)
- Static about / privacy / terms pages

## Controls

| Action | Desktop | Touch |
| --- | --- | --- |
| Rotate | `A`/`D` or `←`/`→` | On-screen rotate |
| Thrust | `W` or `↑` | On-screen thrust |
| Fire | `Space` | On-screen fire |
| Hyperspace | `Shift` | On-screen hyperspace |
| Pause | `P` | — |
| Start | `Enter` | Start overlay |

## Tech stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js ^16.3.6 (App Router) |
| UI | React ^19.3.0, Tailwind CSS ^4.3.3 |
| Language | TypeScript ^6 |
| HUD state | Zustand ^5.0.15 |
| Tests | Node.js test runner via `tsx` (`src/**/*.test.ts`) |

## Project structure

```
src/
  app/                 # page (game), about, privacy, terms
  lib/openastroids/    # Pure engine: game, math, render, audio, high-score
  stores/              # Zustand HUD bridge
  components/          # HUD, overlays, touch controls, error boundary
  hooks/               # use-openastroids-game (RAF loop + input)
```

## Getting started

### Prerequisites

- Node.js 22+
- npm

### Install and run

```bash
git clone https://github.com/brown2020/openastroids.git
cd openastroids
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No environment variables are required.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Node tests on `src/**/*.test.ts` |

## Testing and CI

- Unit tests cover game logic, math, render helpers, audio, high score, and routes.
- `.github/workflows/ci.yml` on `dev` / `main`: lint → typecheck → test → build (no secrets).

## Deployment

Any Next.js host (e.g. Vercel). Client-only; no server secrets.

## Contributing

Branch from `dev`. Keep `src/lib/openastroids` free of React imports. See [`AGENTS.md`](./AGENTS.md) and [`spec.md`](./spec.md).

## License

GNU Affero General Public License v3.0 — see [LICENSE.md](LICENSE.md).
