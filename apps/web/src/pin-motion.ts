import { entry } from "./easing.js";
import type { Spot } from "./knock.js";
import { LANE_LENGTH, LANE_WIDTH, PIN_RADIUS } from "./lane-geometry.js";

export type PinState =
  | "standing"
  | "wobbling"
  | "falling"
  | "knocked"
  | "removed";

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

const FALL_MS = 320;
const REST_MS = 700;
const FADE_MS = 250;
const WOBBLE = (8 * Math.PI) / 180;
const WOBBLE_MS = 600;
const FLAT = Math.PI / 2;
const SIDE = LANE_WIDTH / 2 - PIN_RADIUS;

export const upright = (spot: Spot): PinStaging => ({
  x: spot.x,
  y: spot.y,
  state: "standing",
  tilt: 0,
  direction: 0,
  opacity: 1,
});

export const fall = (
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

export const wobble = (spot: Spot, push: Push, elapsed: number) => {
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
