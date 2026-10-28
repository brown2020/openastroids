# OpenAstroids — Roadmap

Punchlist after the current build. The product as it ships is [`spec.md`](./spec.md). There are no open GitHub issues as of 2026-10-28.

## Next

Ordered by arcade impact. Each item should stay one change on `dev`.

1. **Heartbeat tension audio.** A low pulse during `running` that speeds up as `asteroids.length` drops and resets on a new wave. Keep it compatible with mute and reduced motion.
2. **Large saucer.** One at a time. Enters from a side, wobbles, fires. Worth 200 points. Its shots can break asteroids. Touching the ship costs a life.
3. **Small saucer.** After the large saucer exists, spawn the small one once score is at least 10,000. Faster, smaller, aims ahead of the ship. Worth 1,000 points.
4. **On-screen asteroid cap (26).** Stop splits or spawns from exceeding 26 rocks so late waves stay playable.
5. **Bullet-cap cue.** When fire is held at 4 bullets, show a short “MAX” hint (~300 ms). Reduced motion stays static. No new dependencies.
6. **Hybrid control hints.** Phones keep touch controls only. Keyboard desktops keep the hint and hide the touch bar. A touchscreen laptop should still show keyboard hints without covering the playfield. Today `ontouchstart` or `maxTouchPoints > 0` hides the keyboard hint.
7. **Hyperspace during a shield.** Hyperspace is refused while `invincibleUntilMs` is in the future, including the 1.4 s spawn shield. Decide whether that stays or whether hyperspace is always available and only the landing is risky.
8. **TypeScript 7 linter.** `typescript` is aliased to `@typescript/typescript6` because `typescript-eslint` cannot load TypeScript 7.0. Remove the alias when the linter supports the 7 API (expected around 7.1). Do not point `typescript` itself at 7.0 until then: lint fails.
9. **Browser end-to-end smoke.** Unit tests cover the engine, including a cleared wave and a last-life game over. A scripted browser pass for start, pause, resize, and game over is still manual.

## Suspected, not confirmed

Leave these until a reproduction shows the failure. Do not treat them as open bugs.

- **Thrust release ramp.** `stopThrust` schedules an exponential gain ramp after `setValueAtTime(thrustGain.gain.value, t)`. If that value is 0, the Web Audio spec says the ramp throws. A headless Chrome check did not throw (the audio clock stayed at 0). Confirm in a browser where `AudioContext.currentTime` advances.
- **Stuck keys.** There is no `window` `blur` listener. If the browser drops `keyup` when focus leaves the window, rotate or thrust can stick until the next `keyup`. Not reproduced.
- **First canvas measure.** A 0×0 measure is stored as 1×1. A later resize wraps positions instead of recentering, which could park the ship in a corner. Not observed on the laid-out `h-dvh` page.

## Not in this list

No backend, auth, Firebase rules, Vercel project settings, or environment variables unless `spec.md` changes first. No AI model or provider work: the game has none.
