export const HIGH_SCORE_STORAGE_KEY = "openastroids-highscore";

type ScoreStorage = Pick<Storage, "getItem" | "setItem">;

/** Parses a stored high score string; invalid values become 0. */
export function parseHighScore(raw: string | null): number {
  if (raw === null) return 0;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function getStorage(storage?: ScoreStorage): ScoreStorage | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

/** Reads the persisted high score from local storage (0 if missing or unavailable). */
export function readHighScore(storage?: ScoreStorage): number {
  const store = getStorage(storage);
  if (!store) return 0;
  try {
    return parseHighScore(store.getItem(HIGH_SCORE_STORAGE_KEY));
  } catch {
    return 0;
  }
}

/** Writes a high score to local storage; silently no-ops on invalid input or storage errors. */
export function writeHighScore(score: number, storage?: ScoreStorage): void {
  if (!Number.isFinite(score) || score < 0) return;
  const store = getStorage(storage);
  if (!store) return;
  try {
    store.setItem(HIGH_SCORE_STORAGE_KEY, String(Math.floor(score)));
  } catch {
    // Private mode, quota exceeded, or storage disabled
  }
}

/** Updates storage when score beats the record; returns the best score after the check. */
export function maybeUpdateHighScore(score: number, storage?: ScoreStorage): number {
  const current = readHighScore(storage);
  const normalized = Math.floor(score);
  if (normalized <= current) return current;
  writeHighScore(normalized, storage);
  return normalized;
}
