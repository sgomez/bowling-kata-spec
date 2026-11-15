import { kindOfKnock, type RollKind } from "./roll-kind.js";

export interface Celebration {
  kind: RollKind;
  lights: number;
  beams: boolean;
  confetti: boolean;
  over: boolean;
}

const FLASH_MS = 120;
const PARTY_MS = 1200;
const LASTS: Record<RollKind, number> = {
  strike: 1600,
  spare: 1100,
  zero: 200,
  count: 200,
};
const FLASHES: Record<RollKind, number> = {
  strike: 3,
  spare: 1,
  zero: 0,
  count: 0,
};

const lightsAt = (kind: RollKind, since: number) => {
  const flash = Math.floor(since / FLASH_MS);
  return flash % 2 === 0 && flash / 2 < FLASHES[kind] ? 1 : 0;
};

export const celebrate = (
  standing: number,
  knocked: number,
  since: number,
  reducedMotion: boolean,
): Celebration => {
  const kind = kindOfKnock(standing, knocked);
  const party = kind === "strike" && !reducedMotion && since < PARTY_MS;
  return {
    kind,
    lights: reducedMotion ? 0 : lightsAt(kind, since),
    beams: party,
    confetti: party,
    over: since >= LASTS[kind],
  };
};
