# Architecture

## Map

```
Browser
  └─ Next.js App Router (static /, /about, /privacy, /terms)
       └─ page.tsx (client Home)
            ├─ GameHud / ReadyOverlay / GameOverOverlay / TouchControls
            └─ useOpenAstroidsGame
                 ├─ gameRef (GameState) + inputRef — hot path, no React state
                 ├─ requestAnimationFrame → step() → render()
                 ├─ Zustand HUD (~13 fps)
                 └─ lib/openastroids/* (pure engine, audio, high-score localStorage)
```

## Authority per write

| Path | Fact | Writer | Cache / durability |
| --- | --- | --- | --- |
| start_game | status running | startGame → gameRef | in-memory only |
| fire_bullet | bullets[] | step() | in-memory only |
| destroy_asteroid | score, asteroids | step() | in-memory; score may update high score |
| pause_game | status paused | togglePause → gameRef | in-memory only |
| persist_high_score | best score | maybeUpdateHighScore | localStorage only |
| toggle_mute | mute flag | writeMutedPreference | localStorage only |

No server cache. Reload restores high score / mute from localStorage; live game state is discarded.

## Server / client

All interactive code is client (`"use client"`). Static legal pages are Server Components. No route handlers or server actions. Unauthorized `/api/*` returns Next 404 — there is no privileged mutation surface.

## Change exercises

1. **Data:** change asteroid split scoring in `game.ts` — only engine + `game.test.ts` change.
2. **Access:** adding a future `/api/scores` would require a new route file and explicit auth; today access is "everyone mutates local state; nobody mutates server state" proven by absent routes + 404.
