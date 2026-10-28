# OpenAstroids — Product specification

What the app does today. Next steps, known bugs, and open questions live in [`roadmap.md`](./roadmap.md).

## Product

Play a fast Asteroids-style game in the browser: no install, no account, no data collection. Licensed AGPL-3.0.

Players land on `/`, read the ready dialog, start, destroy asteroids, survive waves, and restart after game over. Pause with `P` or the button; the tab hides the game and it auto-pauses. Touch devices get hold/tap controls. `/about`, `/privacy`, and `/terms` are static pages, and those links are inside the ready and game-over dialogs.

## Features as built

| Area | Behavior |
| --- | --- |
| Ship | Radius 14. Turn 4.6 rad/s. Thrust 520 px/s². Friction 0.985 per 1/60 s, applied as `friction^(dt*60)`. Max speed 560 px/s. Screen wrap. |
| Bullets | Leave the nose at 820 px/s, radius 2.5, live 900 ms, cooldown 180 ms, max 4 on screen. At the cap the cooldown does not advance. Bullets wrap. |
| Asteroids | Large / medium / small radii 52 / 32 / 18. Scores 20 / 50 / 100. A hit splits into two of the next size; small asteroids are destroyed. Each rock has its own polygon. |
| Waves | Clearing the field advances the level and spawns `min(4 + floor(level × 0.75), 12)` large asteroids. Level 1 starts with 4; level 2 spawns 5. |
| Spawn safety | Each rock tries up to 50 positions at least 180 px from the ship. If none qualify, the farthest sample is kept. |
| Lives | Start at 3. +1 life at each 10,000 points, once per threshold. |
| Invincibility | 1,400 ms after create, respawn, and level-up, drawn as a blink. Hyperspace grants 520 ms. While status is not `running`, and when Start is pressed, lifetime timestamps shift forward so ready and pause do not consume the shield, bullet life, or fire cooldown. |
| Hyperspace | Random teleport. Velocity is kept. Landing is tested as a point, not as a path. Refused while `nowMs < invincibleUntilMs`. |
| Collisions | Ship, bullets, and asteroids wrap. Hits use toroidal distance and a swept test along the frame’s velocity so fast objects do not tunnel. A bullet spawned this frame uses the point test. |
| Death | Six ship-triangle debris segments fly for about 600 ms. The intact ship is not drawn on game over. The last life ends the run and keeps score, level, asteroids destroyed, and active time. |
| Run stats | `activeMs` counts only running frames (clamped to 50 ms per frame). Game over shows score, best score, level, `m:ss` survived, and asteroids destroyed. |
| High score | `localStorage` key `openastroids-highscore`. A record is `floor(score) > previousBest`. Ties are not records. The previous best is read before it is overwritten. |
| Audio | Synthesized Web Audio: fire, thrust loop, size-variant explosions, ship death, game over, extra life. Mute key `openastroids-muted`. The context is created on first use and resumed from the start gesture. |
| Visuals | Emerald vectors, glow, star field, CRT scanlines and vignette. CRT animation is disabled when `prefers-reduced-motion` is set. Thrust draws a flame; reduced motion uses a static segment. |
| Input | Keyboard and touch. Touch rotate is separate from key rotate; a keyboard direction wins. Key repeat is ignored for pause, hyperspace, and Enter. Space and Enter do not start or fire while focus is on a control. `preventDefault` applies to Space and arrows only when the target is not a control. |
| Pause | `P`, button, and `visibilitychange` (hidden tab pauses). |
| Restart | New `crypto.getRandomValues` seed. Per-frame RNG seed is `(seed + frameCount) >>> 0` through Mulberry32. |
| Pages | `/` is a client canvas. `/about`, `/privacy`, `/terms` are Server Components. Root layout wraps an error boundary with reload. |
| Headers | On `/:path*`: Content-Security-Policy (`default-src 'self'`, scripts and styles `'self' 'unsafe-inline'`, images `data:` and `blob:`, fonts `data:`, `connect-src 'self'`, workers `blob:`, `frame-ancestors 'none'`, `object-src 'none'`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`. `poweredByHeader` is false. |

## Architecture

```
Browser input (keyboard / touch)
        ↓
  inputRef — not React state
        ↓
  step(prev, input, nowMs, seed)   pure, returns a new GameState
        ↓
  gameRef
        ↓
  render(ctx, state)
        ↓
  Zustand HUD about every 75 ms, and once on game over
```

The loop is `requestAnimationFrame` in `src/hooks/use-openastroids-game.ts`, mounted from `src/app/page.tsx`. Engine modules under `src/lib/openastroids/` do not import React. Zustand holds HUD fields only: status, score, lives, level, touch flag, high score, and whether this run is a new record.

Canvas size follows a `ResizeObserver`. Device pixel ratio is capped at 2.5. `resizeState()` wraps existing positions into the new bounds.

## Out of scope

No accounts, API routes, Server Actions, database, analytics, Firebase, Stripe, or AI providers. No environment variables. Fonts ship through `next/font` (Geist). CI is `.github/workflows/ci.yml` on Node 22 (lint, typecheck, test, production build).

## Constraints

- Do not put game state in React state or Zustand.
- `step()` must not mutate entities in place.
- Privacy copy must keep matching `openastroids-highscore` and `openastroids-muted`.
- There is no global cap on asteroids on screen, no saucers, and no heartbeat pulse. See [`roadmap.md`](./roadmap.md).
