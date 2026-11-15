const FIRST_MS = 500;
const MAX_MS = 8_000;

// Equal jitter: half the ceiling fixed, half random, so dropped clients spread out.
export const reconnectDelay = (
  failures: number,
  random: () => number = Math.random,
): number => {
  const ceiling = Math.min(MAX_MS, FIRST_MS * 2 ** failures);
  return ceiling / 2 + random() * (ceiling / 2);
};
