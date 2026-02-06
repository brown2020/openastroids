# Competitor Analysis: Atari Asteroids (1979)

## 1. Core Value Prop

Asteroids is a skill-based survival game with escalating tension. The player destroys asteroids in an infinite loop of increasingly dangerous waves, competing for a high score. It works because:

- **Instant clarity** — you see the screen, you understand the game
- **Mastery curve** — easy to start, extremely hard to master (ship physics, saucer threats, screen awareness)
- **Score chasing** — the high score table creates replayability and social competition
- **Tension ramp** — the heartbeat thump and saucer appearances build pressure every second

## 2. Feature Breakdown

### Core Mechanics

| Feature | How It Works |
|---------|-------------|
| **Ship rotation** | Left/right buttons rotate continuously. No snap angles. |
| **Thrust** | Accelerates in facing direction. Inertia means you keep drifting — friction is minimal. |
| **Fire** | Shoots forward. **Max 4 bullets on screen at once.** Bullet disappears after crossing the screen or hitting something. A new bullet can only be fired when one clears. |
| **Hyperspace** | Ship disappears and reappears at a random location. Risk: you can self-destruct or land on an asteroid. Emergency-only mechanic. |
| **Screen wrap** | All objects wrap around edges (toroidal topology). |

### Asteroid System

| Feature | Details |
|---------|---------|
| **3 sizes** | Large → 2 medium → 2 small → destroyed |
| **Speed scaling** | Small asteroids move faster than large ones |
| **Scoring** | Large: 20 pts, Medium: 50 pts, Small: 100 pts |
| **26-asteroid cap** | Max 26 asteroids on screen. If at cap when one splits, only 1 child spawns instead of 2 |
| **Wave start** | Wave 1 starts with 4 large asteroids. Count increases each wave, up to ~11 |

### Enemy Saucers (UFOs)

This is the single most important feature missing from most Asteroids clones.

| Feature | Details |
|---------|---------|
| **Large saucer** | Appears early. Fires bullets in random directions. Worth 200 pts. |
| **Small saucer** | Appears after player reaches ~10,000 pts. Fires accurately — leads the player's position. Worth 1,000 pts. Extremely dangerous. |
| **Entry pattern** | Always enters from left or right edge, never top/bottom. Flies across screen in a wobbly horizontal path. |
| **Saucer bullets** | Can hit asteroids, breaking them — creating chaos the player must manage. |
| **Spawn timing** | Appears periodically, more frequently as waves progress. Only one on screen at a time. |

### Scoring and Progression

| Feature | Details |
|---------|---------|
| **Score display** | Always visible at top of screen |
| **Extra life** | Awarded every 10,000 points |
| **Lives display** | Small ship icons showing remaining lives |
| **High score table** | Top scores with 3-letter initials. Shown during attract mode. Persists across plays (stored in cabinet RAM). |
| **Max score** | 99,990 (rolls over to 0) |

### Audio

The original Asteroids has one of the most iconic soundscapes in gaming:

| Sound | Purpose |
|-------|---------|
| **Heartbeat thump** | Two alternating bass tones ("thump-thump") that play continuously. Tempo increases as fewer asteroids remain on screen, building tension. Resets each wave. |
| **Fire** | Short sharp sound on each shot |
| **Thrust** | Continuous rumble while thrust button held |
| **Asteroid explosion** | Different sounds for different sizes |
| **Ship explosion** | Distinctive crash sound with ship debris flying outward |
| **Saucer sound** | Warbling tone while saucer is on screen. Different pitch for large vs small saucer. |
| **Extra life** | Audio cue when bonus life awarded |

### Visual Design

| Feature | Details |
|---------|---------|
| **Vector graphics** | Clean geometric lines on black background. No fill, just outlines. |
| **Ship shape** | Narrow triangle pointing in facing direction |
| **Ship debris** | On death, ship breaks into line segments that fly apart — not a generic explosion |
| **Thrust flame** | Small flickering line behind ship when thrusting |
| **Asteroid shapes** | Irregular polygons, each unique |
| **Blinking invincibility** | Ship blinks when respawning |

### Game Modes

| Feature | Details |
|---------|---------|
| **1 player** | Standard mode |
| **2 player** | Alternating turns (not simultaneous). Players take turns when one dies. |
| **Attract mode** | When no one is playing: shows high score table, demo text, game title |

## 3. UX Strengths

1. **Immediate readability** — black background, white vector lines, zero visual noise. You always know exactly what's happening.
2. **Responsive controls** — rotation is instant, thrust is smooth, firing has zero delay. The ship feels good to pilot.
3. **Tension escalation** — the heartbeat thump getting faster is genius. It creates anxiety without any visual change.
4. **Risk/reward everywhere** — hyperspace is risky, small asteroids are harder but worth more, saucers are dangerous but worth 1000 pts, staying still is safe but saucers will find you.
5. **Clear feedback** — every action has a sound. Every hit has a visual explosion. You always know what happened.
6. **The saucer threat** — forces players to keep moving. Without saucers, you could camp in one spot. The small saucer's accurate fire makes high-level play a constant dance.
7. **High score initials** — three letters on the board gives just enough identity to create bragging rights.

## 4. UX Weaknesses

1. **No progression beyond score** — no unlockables, no achievements, no milestones. Just an ever-increasing number.
2. **No visual variety** — same black-and-white screen forever. No visual reward for reaching high levels.
3. **Abrupt game over** — no stats summary, no "you made it to wave X", just back to attract mode.
4. **Two-player mode is weak** — alternating turns, not cooperative or competitive simultaneous play.
5. **No tutorial** — you're expected to figure it out from the cabinet art. Fine in 1979, not great for web.
6. **No pause** — arcade games don't pause. Web games should.
7. **Score rollover** — max 99,990 means extreme skill isn't tracked. A modern version has no reason for this limit.

## 5. Table Stakes

Any Asteroids game that wants to be taken seriously must have:

1. Ship with rotation, thrust, inertia, and fire
2. Asteroids that split into smaller pieces across 3 sizes
3. Screen wrapping (toroidal space)
4. Scoring: 20 / 50 / 100 for large / medium / small
5. Lives system with extra lives at score thresholds
6. **Flying saucers** — both large (random fire) and small (accurate fire)
7. Sound effects — fire, thrust, explosions, heartbeat thump
8. High score persistence
9. Increasing difficulty per wave
10. Bullet limit (max 4 on screen)

## 6. Differentiators — What We Can Do Better

1. **Modern audio with Web Audio API** — synthesized retro sounds that feel authentic but are generated in-browser, no asset downloads
2. **Persistent high scores** — local storage or cloud-based leaderboard, not just session-based
3. **Game-over stats screen** — show wave reached, asteroids destroyed, accuracy, time survived
4. **Visual polish** — CRT scanline effect, glow, screen shake on explosions (already partially implemented)
5. **Pause and resume** — essential for web/mobile (already implemented)
6. **Touch controls** — mobile support the original never had (already implemented)
7. **Accessibility** — reduced motion support, keyboard focus indicators (already implemented)
8. **Ship debris on death** — authentic line-segment breakup instead of generic explosion particles
9. **Thrust flame visual** — flickering exhaust when thrusting, like the original
10. **Responsive design** — works on any screen size (already implemented)
