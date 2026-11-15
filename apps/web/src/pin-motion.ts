import type { Pin } from "@bowling/domain";
import { entry } from "./easing.js";
import type { Spot } from "./knock.js";
import { LANE_LENGTH, LANE_WIDTH, PIN_RADIUS } from "./lane-geometry.js";

type PinState = "standing" | "wobbling" | "falling" | "knocked" | "removed";

export interface PinStaging extends Spot {
  state: PinState;
  tilt: number;
  direction: number;
  opacity: number;
}

export interface Push {
  at: number;
  direction: number;
}

const ROW_MS = 40;
const FALL_MS = 320;
const REST_MS = 700;
const FADE_MS = 250;
const WOBBLE = (8 * Math.PI) / 180;
const WOBBLE_MS = 600;
const FLAT = Math.PI / 2;
const SIDE = LANE_WIDTH / 2 - PIN_RADIUS;

const upright = (spot: Spot): PinStaging => ({
  x: spot.x,
  y: spot.y,
  state: "standing",
  tilt: 0,
  direction: 0,
  opacity: 1,
});

const fall = (
  { x, y }: Spot,
  push: Push,
  elapsed: number,
  reducedMotion = false,
): PinStaging => {
  const since = elapsed - push.at;
  const onLane = {
    x: Math.max(-SIDE, Math.min(SIDE, x)),
    y: Math.min(LANE_LENGTH - PIN_RADIUS, y),
  };
  if (since < 0) return upright(onLane);
  const lying = { ...onLane, direction: push.direction, tilt: FLAT };
  if (since < FALL_MS) {
    const share = since / FALL_MS;
    const tilt = FLAT * (reducedMotion ? share : entry(share));
    return { ...lying, state: "falling", tilt, opacity: 1 };
  }
  const fading = since - FALL_MS - REST_MS;
  if (fading >= FADE_MS) return { ...lying, state: "removed", opacity: 0 };
  const opacity = 1 - Math.max(0, fading) / FADE_MS;
  return { ...lying, state: "knocked", opacity };
};

const wobble = (spot: Spot, push: Push, elapsed: number) => {
  const progress = (elapsed - push.at) / WOBBLE_MS;
  if (progress >= 1) return upright(spot);
  const swing = Math.sin(progress * 3 * Math.PI) * (1 - progress);
  return {
    ...upright(spot),
    state: "wobbling" as const,
    tilt: WOBBLE * swing,
    direction: push.direction,
  };
};

export interface PinCues {
  spots: ReadonlyMap<Pin, Spot>;
  poses: ReadonlyMap<Pin, Spot>;
  nudged: ReadonlyMap<Pin, Push>;
  toppled: ReadonlyMap<Pin, Push>;
}

const rowOf = (pin: Pin) => (pin <= 1 ? 0 : pin <= 3 ? 1 : pin <= 6 ? 2 : 3);

// The Pins at `elapsed`, when the ball first touched one, and when all are still.
export const stagePins = (
  { spots, poses, nudged, toppled }: PinCues,
  elapsed: number,
  reducedMotion: boolean,
) => {
  const impact = Math.min(
    ...[...nudged.values(), ...toppled.values()].map(({ at }) => at),
  );
  const falls = new Map(
    [...toppled].map(([pin, push]) => {
      const at = Math.max(push.at, impact + rowOf(pin) * ROW_MS);
      return [pin, { ...push, at }];
    }),
  );
  const wobbles = new Map(
    reducedMotion ? [] : [...nudged].filter(([pin]) => !toppled.has(pin)),
  );
  const pinAt = (pin: Pin, spot: Spot): PinStaging => {
    const push = falls.get(pin);
    if (push) return fall(poses.get(pin) ?? spot, push, elapsed, reducedMotion);
    const nudge = wobbles.get(pin);
    return nudge ? wobble(spot, nudge, elapsed) : upright(spot);
  };
  const stillAt = Math.max(
    ...[...falls.values()].map(({ at }) => at + FALL_MS + REST_MS + FADE_MS),
    ...[...wobbles.values()].map(({ at }) => at + WOBBLE_MS),
  );
  const pins = new Map(
    [...spots].map(([pin, spot]) => [pin, pinAt(pin, spot)]),
  );
  return { pins, impact, stillAt };
};
