# OpenAstroids

A modern, open-source Asteroids clone for the browser: vector-style canvas graphics, keyboard and touch controls, entirely client-side. No backend, auth, API routes, database, or environment variables. Play at [https://openastroids.vercel.app](https://openastroids.vercel.app).

## Features

- Classic arcade loop: rotate, thrust, inertia, fire (max 4 bullets), hyperspace, screen wrap
- Three asteroid sizes that split on hit (20 / 50 / 100 points), with waves that grow by level
- Three lives, a 1.4 s spawn shield, and an extra life at each 10,000 points
- Pause and resume, including auto-pause when the tab is hidden
- Local high score and a “new record” marker when the score beats the previous best
- Game-over summary: score, best score, level, time survived, asteroids destroyed
- Synthesized Web Audio effects and a mute toggle stored in the browser
- Emerald vector canvas with glow, a star field, and a CRT overlay (the overlay stays still when reduced motion is requested)
- Desktop keyboard controls and on-screen touch controls
- Static About, Privacy, and Terms pages, plus an error boundary with reload
- Baseline security headers (CSP, `nosniff`, referrer policy, frame denial) and `X-Powered-By` removed

## Controls

| Action | Desktop | Touch |
| --- | --- | --- |
| Rotate | `A` / `D` or `←` / `→` | Hold rotate |
| Thrust | `W` or `↑` | Hold thrust |
| Fire | `Space` | Hold fire |
| Hyperspace | `Shift` | Tap hyperspace |
| Pause | `P` or the pause button | Pause button |
| Start / resume | `Enter` or the overlay button | Overlay button |

Game keys are ignored while focus is on a link, button, or form control, so the overlay links stay usable.

## Tech stack

| Layer | Package |
| --- | --- |
| Framework | Next.js ^16.4.3 (App Router) |
| UI | React ^19.3.1, React DOM ^19.3.1 |
| Styling | Tailwind CSS ^4.3.3, `@tailwindcss/postcss` ^4.3.3, PostCSS ^8.5.32 |
| HUD state | Zustand ^5.0.16 |
| Language | TypeScript 7.0.2 (`tsc` via `@typescript/native`) |
| Lint types | `typescript` aliased to `@typescript/typescript6` ^6.0.2 so ESLint can load the compiler API |
| Lint | ESLint ^10.13.0, `eslint-config-next` ^16.4.3 |
| Tests | Node.js test runner via `tsx` ^4.23.15 (`src/**/*.test.ts`) |
| Types | `@types/node` ^26.6.6, `@types/react` ^19.3.0, `@types/react-dom` ^19.3.0 |

`npm run typecheck` runs TypeScript 7. The `typescript` package stays on the TypeScript 6 API because `typescript-eslint` and `eslint-config-next` cannot import TypeScript 7.0. Drop that alias when the linter supports the TypeScript 7 API.

## Project structure

```
src/
  app/                 # page (game), about, privacy, terms
  lib/openastroids/    # Pure engine: game, math, render, audio, high-score
  stores/              # Zustand HUD bridge
  components/          # HUD, overlays, touch controls, error boundary
  hooks/               # use-openastroids-game (rAF loop + input)
```

## Getting started

### Prerequisites

- Node.js 22
- npm

### Install and run

```bash
git clone https://github.com/brown2020/openastroids.git
cd openastroids
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

None. The app does not read `process.env` and has no `.env` file. Do not add client keys to the bundle.

Browser-only storage uses these `localStorage` key names:

- `openastroids-highscore` — best score
- `openastroids-muted` — mute preference

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` (TypeScript 7) |
| `npm test` | Node tests on `src/**/*.test.ts` |

Canonical check before commit:

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

## Testing and CI

Unit tests cover the engine (including a cleared wave and a last-life game over), math, render helpers, audio storage, high score, routes, and security headers. Gameplay smoke on a real browser is still manual.

`.github/workflows/ci.yml` runs on pushes and pull requests to `dev` and `main`: `npm ci`, lint, typecheck, test, and build on Node 22. The workflow requests `contents: read` and does not use secrets.

## Deployment

Any Next.js host works. The public site is on Vercel. The build is client-only and needs no server secrets.

## Contributing

Branch from `dev`. Keep `src/lib/openastroids` free of React imports. Product behavior is in [`spec.md`](./spec.md). The punchlist is in [`roadmap.md`](./roadmap.md). Agent workflow is in [`AGENTS.md`](./AGENTS.md).

## License

GNU Affero General Public License v3.0 — see [LICENSE.md](LICENSE.md).
