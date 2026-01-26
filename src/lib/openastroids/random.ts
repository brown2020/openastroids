/** Random number generator function type - returns values in range [0, 1) */
export type Rng = () => number;

/**
 * Creates a seeded pseudorandom number generator using the Mulberry32 algorithm.
 * Produces deterministic, repeatable sequences for debugging and testing.
 * 
 * @param seed - Initial seed value (any 32-bit integer)
 * @returns Function that generates random numbers in range [0, 1)
 * @see {@link https://github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32}
 */
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

/**
 * Generates a short, pseudo-unique ID string from an RNG.
 * Used for creating unique identifiers for game entities.
 * @param rng - Random number generator
 * @returns Base-36 encoded ID string
 */
export function id(rng: Rng): string {
  return Math.floor(rng() * 1e9).toString(36);
}
