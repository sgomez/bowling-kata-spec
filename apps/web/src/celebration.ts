type CelebrationKind = "strike" | "spare" | "zero" | "count";

export interface Celebration {
  kind: CelebrationKind;
  lights: number;
  beams: boolean;
  confetti: boolean;
  over: boolean;
}

const RACK = 10;
const FLASH_MS = 120;
const PARTY_MS = 1200;
const LASTS: Record<CelebrationKind, number> = {
  strike: 1600,
  spare: 1100,
  zero: 200,
  count: 200,
};
const FLASHES: Record<CelebrationKind, number> = {
  strike: 3,
  spare: 1,
  zero: 0,
  count: 0,
};

const kindOf = (standing: number, knocked: number): CelebrationKind => {
  if (knocked === 0) return "zero";
  if (knocked < standing) return "count";
  return standing === RACK ? "strike" : "spare";
};

// Lit for 120 ms, dark for 120 ms, as many times as the kind flashes.
const lightsAt = (kind: CelebrationKind, since: number) => {
  const flash = Math.floor(since / FLASH_MS);
  return flash % 2 === 0 && flash / 2 < FLASHES[kind] ? 1 : 0;
};

export const celebrate = (
  standing: number,
  knocked: number,
  since: number,
  reducedMotion: boolean,
): Celebration => {
  const kind = kindOf(standing, knocked);
  const party = kind === "strike" && !reducedMotion && since < PARTY_MS;
  return {
    kind,
    lights: reducedMotion ? 0 : lightsAt(kind, since),
    beams: party,
    confetti: party,
    over: since >= LASTS[kind],
  };
};
