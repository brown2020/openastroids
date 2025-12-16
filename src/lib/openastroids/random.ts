export type Rng = () => number;

// Mulberry32: tiny seeded RNG for repeatable runs (useful for debugging)
export function createRng(seed: number): Rng {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function id(rng: Rng) {
  return Math.floor(rng() * 1e9).toString(36);
}


