# OpenAstroids — Product Specification

Authoritative product and roadmap document. Derived from codebase review (May 2026), not from stale planning files.

---

## 1. Product overview

### Product promise

Play a faithful, fast Asteroids-style arcade game in the browser — no install, no account, no data collection. Open source under AGPL-3.0.

### Target users

- **Casual players** wanting a quick retro arcade session on desktop or mobile
- **Retro game fans** comparing the experience to the 1979 Atari original
- **Developers** learning or extending a clean canvas + React game architecture

### Core workflows

1. **Play:** Land on `/` → read controls overlay → Start → destroy asteroids → survive waves → game over → play again
2. **Pause/resume:** P key or Pause button; auto-pause when tab hidden
3. **Mobile play:** Touch controls replace keyboard hints; same game canvas
4. **Learn more:** `/about` for rules and scoring; `/privacy` and `/terms` for legal

### Product goals

1. Core Asteroids feel: inertia, wrap-around, splitting asteroids, escalating waves
2. Modern web UX: responsive canvas, touch, pause, reduced-motion support
3. Zero backend complexity: fully client-side, privacy-respecting
4. Incremental fidelity: close gaps vs. the arcade original (audio, saucers, scoring persistence) without scope creep into unrelated product directions

---

## 2. Current application state

### What the app does

OpenAstroids is a single-page canvas game embedded in a Next.js app. A `requestAnimationFrame` loop runs pure TypeScript simulation (`step`) and canvas rendering (`render`). React handles mounting, input wiring, HUD overlays, and static informational pages.

### Feature inventory

| Area | Status | Notes |
|------|--------|-------|
| Ship movement | ✅ | Rotation, thrust, friction, max speed 560 px/s |
| Screen wrap | ✅ | Ship, bullets, asteroids |
| Firing | ✅ | Cooldown 180 ms; lifetime 900 ms; max 4 on screen |
| Bullet limit (max 4) | ✅ | Enforced in `game.ts` `step()` |
| Asteroid sizes | ✅ | Large → 2 medium → 2 small → gone |
| Scoring | ✅ | 20 / 50 / 100 points |
| Lives | ✅ | Start 3; +1 bonus life at each 10k score |
| Invincibility | ✅ | 1.4 s spawn/respawn; blink render |
| Hyperspace | ✅ | Random teleport; 520 ms invincibility |
| Level waves | ✅ | 4 + floor(level × 0.75) large asteroids, cap 12 |
| Asteroid cap (26 total) | ❌ | No global cap on screen count |
| Flying saucers | ❌ | Not implemented |
| Sound / music | ❌ | Silent |
| High score persistence | ✅ | Single best score in `localStorage` (`openastroids-highscore`) |
| Extra life at 10k | ✅ | `nextExtraLifeAt` threshold in `game.ts` |
| Thrust flame | ✅ | Flickering exhaust line when thrusting; static when reduced-motion |
| Ship debris on death | ✅ | Six triangle segments fly outward (~600 ms) |
| Game-over stats | ✅ | Score, level, asteroids destroyed, time survived |
| Pause / resume | ✅ | P, button, visibility auto-pause |
| Restart | ✅ | New crypto seed |
| CRT / glow visuals | ✅ | Disabled when prefers-reduced-motion |
| Touch controls | ✅ | Hold/tap buttons |
| Desktop control hints | ✅ | Hidden on touch-detected devices |
| About / privacy / terms | ✅ | Static Server Component pages |
| Error boundary | ✅ | Reload fallback |

### User flows

```
[Ready overlay] --Enter/Start--> [Running] --P/Pause btn--> [Paused] --Resume--> [Running]
                                      |
                                      +-- ship hit, lives > 0 --> respawn (invincible)
                                      +-- ship hit, lives = 0 --> [Game Over] --Restart--> [Ready]
                                      +-- all asteroids cleared --> next level (invincible)
```

Touch flow mirrors keyboard: hold rotate/thrust/fire, tap hyperspace.

### Integrations

**None.** No analytics, auth, database, API, or third-party SDKs. Fonts loaded via `next/font/google` (Geist).

### Architecture summary

```
Next.js App Router
├── Server Components: layout, about, privacy, terms
└── Client: page.tsx (loop + input + HUD)
         └── lib/openastroids/* (pure engine)
         └── stores/openastroids-store.ts (HUD bridge)
```

- **Deployment:** Standard Next.js build; README references Vercel. No `output: 'export'` in `next.config.ts` (inferred: server or static hybrid via Next defaults).
- **No env vars** in codebase.
- **No CI config** in repository (inferred).

### Technical constraints

- Game state must stay in refs to avoid 60 fps React re-renders
- Canvas DPR capped at 2.5× for performance
- Frame delta clamped to 50 ms in `step()` to limit spiral-of-death
- Asteroid spawn avoids ship within 180 px (50 retries; may fail on tiny viewports)
- Seeded Mulberry32 RNG for reproducible asteroid shapes and splits

### Known limitations

| Limitation | Source |
|------------|--------|
| No audio | By omission — largest gap vs. original |
| No saucers | By omission — removes late-game pressure |
| Touch detection hides keyboard hints on touchscreen laptops | `ontouchstart` / `maxTouchPoints` heuristic in `page.tsx` |
| No automated tests | No test framework or scripts |
| Enter does not restart from game over | Only Restart button / flow from overlay |

---

## 3. Product roadmap

Ordered by product impact and dependency. Each item is sized for one clean commit sequence on `dev`.

---

### Milestone 1 — Bullet limit (max 4 on screen) ✅

**Status:** Complete (May 2026)

**Implementation note:** Added `MAX_BULLETS_ON_SCREEN = 4` in `game.ts`. Firing is skipped when `bullets.length >= 4`; cooldown does not advance at the limit. Unit tests cover at-limit blocking and refire after expiry.

**User value:** Restores classic resource management; prevents screen clutter and easy high scores.

**Implementation intent:** In `game.ts` `step()`, skip firing when `bullets.length >= 4`. Optionally show brief HUD feedback when limit reached (defer UI polish if not trivial).

**Acceptance criteria:**
- [x] Cannot exceed 4 player bullets simultaneously
- [x] Firing resumes when a bullet expires or hits an asteroid
- [x] Existing cooldown behavior unchanged
- [x] Lint, typecheck, build pass

**Follow-up (deferred):** Optional HUD cue when player tries to fire at the 4-bullet limit (see Milestone 12).

---

### Milestone 2 — Thrust flame visual ✅

**Status:** Complete (May 2026)

**Implementation note:** Extended `RenderOptions` with `isThrusting` and `prefersReducedMotion`. `drawThrustFlame()` renders a line behind the ship during running gameplay; animated flicker uses `nowMs`, reduced-motion uses a fixed 10px segment. Wired from `page.tsx` input ref in the rAF loop.

**User value:** Immediate feedback that thrust is active; closer to arcade authenticity.

**Implementation intent:** In `render.ts` `drawShip()`, when thrusting (pass input or ship state flag into render options), draw a short flickering line segment behind the ship. Use frame/time for flicker; respect reduced-motion (static shorter flame or omit).

**Acceptance criteria:**
- [x] Flame visible only while thrust input active during running state
- [x] No measurable frame-rate regression on mid-range mobile
- [x] Reduced-motion path does not animate flicker aggressively

---

### Milestone 3 — Authentic ship death debris ✅

**Status:** Complete (May 2026)

**Implementation note:** Added `Debris` type and `debris[]` on `GameState`. `spawnShipDebris()` creates 6 segments from the ship triangle with outward velocity; replaces the radial ship explosion on collision. Rendered in `drawDebris()` with fade-out; expires after 600 ms. No collision or scoring impact.

**User value:** Death feels like the original; clearer feedback on collision.

**Implementation intent:** Add `Debris` entity type (line segments with velocity and lifetime) in `types.ts`. On ship explosion in `game.ts`, spawn 4–6 segments from ship triangle vertices instead of/in addition to radial explosion. Render in `render.ts`; expire after ~600 ms.

**Acceptance criteria:**
- [x] Ship-asteroid collision produces outward-flying line segments
- [x] Debris does not affect collision or scoring
- [x] Game over and respawn flows unchanged

---

### Milestone 4 — Local high score with honest privacy copy ✅

**Status:** Complete (May 2026)

**Implementation note:** Added `high-score.ts` with `readHighScore` / `maybeUpdateHighScore` using key `openastroids-highscore`. Loaded on mount; updated on game over in the rAF loop. Zustand exposes `highScore` for ready and game-over overlays. Privacy policy updated to describe local-only numeric storage and reset behavior.

**User value:** Replay motivation; scores survive refresh without backend.

**Implementation intent:** `localStorage` key (e.g. `openastroids-highscore`) read on mount, updated on game over if `score` exceeds stored value. Display best score on ready and game-over overlays. Update `privacy/page.tsx` to accurately describe what is stored (single numeric high score, local only).

**Acceptance criteria:**
- [x] High score persists across page reload
- [x] No network requests for scores
- [x] Privacy page matches actual behavior
- [x] Clearing site data resets score (document in privacy page)

---

### Milestone 5 — Extra life at 10,000 points ✅

**Status:** Complete (May 2026)

**Implementation note:** Added `nextExtraLifeAt` to `GameState` (starts at 10,000). `applyScoreExtraLives()` runs after scoring each frame, awarding +1 life per threshold crossed and advancing the threshold by 10k. Resets on `resetGame`. HUD picks up life changes via existing Zustand bridge.

**User value:** Classic progression reward; extends sessions for skilled players.

**Implementation intent:** Track `extraLifeAwardedAt` threshold multiples in `GameState` or derive from score. At each 10,000-point boundary, increment lives once and optionally flash HUD. Match arcade: one extra life per threshold crossed per run.

**Acceptance criteria:**
- [x] At 10k, 20k, 30k… player gains +1 life (once per threshold)
- [x] Lives display updates via existing HUD bridge
- [x] No infinite life exploit from score reset within same frame

**Follow-up (deferred):** Optional HUD flash or sound when an extra life is earned (see Milestone 7 audio).

---

### Milestone 6 — Game-over summary screen ✅

**Status:** Complete (May 2026)

**Implementation note:** Added `asteroidsDestroyed` and `activeMs` to `GameState`. Bullets increment destroy count; `activeMs` accumulates per running frame (pause excluded). Game-over overlay shows level, time (`m:ss`), and asteroids destroyed alongside score/high score. Stats reset via `resetGame`.

**User value:** Closure and shareable moment; answers "how far did I get?"

**Implementation intent:** Extend game-over overlay (or `GameState` snapshot at death) to show level reached, asteroids destroyed (counter added in `game.ts`), and time survived. Keep layout consistent with existing emerald overlay style.

**Acceptance criteria:**
- [x] Game over shows: final score, level, asteroids destroyed, time played
- [x] Stats accurate for the completed run
- [x] Restart clears run stats

---

### Milestone 7 — Web Audio sound effects

**User value:** Audio feedback transforms feel; addresses the largest sensory gap.

**Implementation intent:** Add `src/lib/openastroids/audio.ts` — Web Audio API oscillators/noise for fire, thrust (loop while held), asteroid explosions (size-variant), ship death, extra life. Gate on user gesture (first Start click) for autoplay policy. Mute toggle in HUD. No asset files required (synthesized retro tones).

**Acceptance criteria:**
- Fire, thrust, explosion, and game-over sounds play during gameplay
- Audio initializes after user starts game (browser policy compliant)
- Mute preference persists in session or localStorage
- Silent by default until first interaction if required by browser

---

### Milestone 8 — Heartbeat tension audio

**User value:** Builds arcade tension as asteroid count drops; iconic original behavior.

**Implementation intent:** After Milestone 7 audio exists, add continuous low-frequency pulse whose tempo increases as `asteroids.length` decreases; reset tempo on level advance. Tie to reduced-motion preference (optional softer curve).

**Acceptance criteria:**
- Pulse audible during running state
- Tempo visibly correlates with remaining asteroids
- Resets on new wave

**Depends on:** Milestone 7

---

### Milestone 9 — Large flying saucer

**User value:** Introduces unpredictable threat; breaks camping; core Asteroids identity.

**Implementation intent:** Add `Saucer` type to engine. Spawn timer in `step()` — enters from left/right edge, horizontal wobbly path, fires random-direction bullets on interval. Player bullets destroy saucer (+200 pts). Saucer bullets can break asteroids. Max one saucer on screen. Render saucer outline in `render.ts`.

**Acceptance criteria:**
- Saucer appears periodically during running gameplay
- Saucer worth 200 points when destroyed
- Saucer bullets interact with asteroids
- Collision with ship costs a life (same as asteroid)

---

### Milestone 10 — Small saucer (accurate fire)

**User value:** Late-game skill check for high scorers; matches original escalation.

**Implementation intent:** After Milestone 9, spawn small saucer when score ≥ 10,000 (or level threshold). Smaller hitbox, faster, aims at predicted ship position. Worth 1,000 points.

**Acceptance criteria:**
- Small saucer appears only after score threshold
- Noticeably more accurate than large saucer
- Worth 1000 points

**Depends on:** Milestone 9

---

### Milestone 12 — Bullet limit HUD feedback (optional polish)

**User value:** Subtle feedback when the 4-bullet cap blocks a shot, without adding clutter.

**Implementation intent:** When `isFiring` and at bullet limit during running state, briefly flash or dim the HUD score row or show a one-line “MAX” indicator for ~300 ms. Respect reduced-motion (static text only).

**Acceptance criteria:**
- Visible only when fire input is active and limit is reached
- Does not persist or block gameplay
- No new dependencies

---

### Milestone 11 — Hybrid device control hints

**User value:** Touchscreen laptop users see both touch controls and keyboard hints.

**Implementation intent:** Replace binary `isTouch` with finer detection: e.g. show keyboard hints unless narrow viewport + touch-only interaction, or show both on large touch devices. Avoid breaking phone layout.

**Acceptance criteria:**
- Desktop with keyboard: keyboard hints visible, no touch bar
- Phone: touch controls, no keyboard hint clutter
- Touchscreen laptop: usable keyboard hints or dual hints without overlap

---

## Appendix — Consolidated references

This document supersedes prior planning content. Historical competitor research informed the roadmap (saucers, audio, bullet limit, extra lives) but is not a separate source of truth.

**Related docs:**
- `AGENTS.md` — agent workflow and architecture
- `README.md` — install and run
- `CLAUDE.md` — pointer to `AGENTS.md`
