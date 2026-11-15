import type { Pin } from "@bowling/domain";
import { HEAD_PIN, PIN_SPACING } from "./lane-geometry.js";

export interface Spot {
  x: number;
  y: number;
}

export interface Pose extends Spot {
  angle: number;
}

// Hand-tuned: past these a Pin counts as fallen.
const DISPLACED = 0.03;
const TILTED = 0.3;
const STILL_SPEED = 0.02;
const MAX_ROLL_MS = 10_000;

const ROWS: Pin[][] = [[1], [2, 3], [4, 5, 6], [7, 8, 9, 10]];

const spotOf = (pin: Pin): Spot => {
  const row = ROWS.findIndex((pins) => pins.includes(pin));
  const index = (ROWS[row] as Pin[]).indexOf(pin);
  return {
    x: (index - row / 2) * PIN_SPACING,
    y: HEAD_PIN + (row * PIN_SPACING * Math.sqrt(3)) / 2,
  };
};

export const rack = (standing: readonly Pin[]): Map<Pin, Spot> =>
  new Map(standing.map((pin) => [pin, spotOf(pin)]));

export const knockedPins = (
  spots: ReadonlyMap<Pin, Spot>,
  poses: ReadonlyMap<Pin, Pose>,
): Pin[] =>
  [...spots].flatMap(([pin, spot]) => {
    const pose = poses.get(pin);
    if (!pose) return [pin];
    const moved = Math.hypot(pose.x - spot.x, pose.y - spot.y);
    return moved > DISPLACED || Math.abs(pose.angle) > TILTED ? [pin] : [];
  });

export const hasSettled = (speeds: readonly number[], elapsedMs: number) =>
  elapsedMs >= MAX_ROLL_MS || speeds.every((speed) => speed < STILL_SPEED);
