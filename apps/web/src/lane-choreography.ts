import type { Pin } from "@bowling/domain";
import { knockedPins, type Pose, rack, type Spot } from "./knock.js";
import { BALL_RADIUS, FOUL_LINE, LANE_WIDTH } from "./lane-geometry.js";
import {
  fall,
  type PinStaging,
  type Push,
  upright,
  wobble,
} from "./pin-motion.js";
import type { Swipe } from "./swipe.js";

export type { PinStaging, PinState } from "./pin-motion.js";

export interface BallStaging extends Spot {
  roll: number;
  spin: number;
  gutter: boolean;
}

export interface Staging {
  pins: ReadonlyMap<Pin, PinStaging>;
  ball: BallStaging;
  done: boolean;
}

export interface Moment {
  elapsed: number;
  ball: Pose;
  pins: ReadonlyMap<Pin, Pose>;
}

export interface RollTrack {
  elapsed: number;
  spin: number;
  ball: Spot;
  travelled: number;
  gutter: boolean;
  knocked?: readonly Pin[];
  spots: ReadonlyMap<Pin, Spot>;
  poses: ReadonlyMap<Pin, Pose>;
  nudged: ReadonlyMap<Pin, Push>;
  toppled: ReadonlyMap<Pin, Push>;
}

const ROW_MS = 40;
// Hand-tuned: radians per second at full spin.
const SPIN_RATE = 4 * Math.PI;
// Below these a Pin is untouched, not nudged.
const TOUCHED = 0.002;
const TURNED = 0.01;

const rowOf = (pin: Pin) => (pin <= 1 ? 0 : pin <= 3 ? 1 : pin <= 6 ? 2 : 3);

export const trackRoll = (
  standing: readonly Pin[],
  swipe: Swipe,
): RollTrack => ({
  elapsed: 0,
  spin: swipe.spin,
  ball: { x: swipe.release, y: FOUL_LINE },
  travelled: 0,
  gutter: false,
  spots: rack(standing),
  poses: new Map(),
  nudged: new Map(),
  toppled: new Map(),
});

const pushOf = (spot: Spot, pose: Pose, at: number): Push => ({
  at,
  direction: Math.atan2(pose.x - spot.x, pose.y - spot.y),
});

const touched = (spot: Spot, pose: Pose) =>
  Math.hypot(pose.x - spot.x, pose.y - spot.y) > TOUCHED ||
  Math.abs(pose.angle) > TURNED;

export const observe = (track: RollTrack, moment: Moment): RollTrack => {
  const { elapsed, pins: poses, ball } = moment;
  const nudged = new Map(track.nudged);
  const toppled = new Map(track.toppled);
  const knocked = knockedPins(track.spots, poses);
  for (const [pin, spot] of track.spots) {
    const pose = poses.get(pin);
    if (!pose) continue;
    if (!nudged.has(pin) && touched(spot, pose)) {
      nudged.set(pin, pushOf(spot, pose, elapsed));
    }
    if (!toppled.has(pin) && knocked.includes(pin)) {
      toppled.set(pin, pushOf(spot, pose, elapsed));
    }
  }
  const moved = Math.hypot(ball.x - track.ball.x, ball.y - track.ball.y);
  return {
    ...track,
    elapsed,
    ball: { x: ball.x, y: ball.y },
    travelled: track.travelled + moved,
    gutter: track.gutter || Math.abs(ball.x) > LANE_WIDTH / 2,
    poses,
    nudged,
    toppled,
  };
};

// The outcome is what counts: only the Pins it knocked fall.
export const settle = (
  track: RollTrack,
  knocked: readonly Pin[],
): RollTrack => {
  const fallen = (pin: Pin): Push =>
    track.toppled.get(pin) ?? {
      at: track.elapsed,
      direction: track.nudged.get(pin)?.direction ?? 0,
    };
  const toppled = new Map(knocked.map((pin) => [pin, fallen(pin)]));
  return { ...track, knocked, toppled };
};

export interface Manner {
  reducedMotion?: boolean;
}

export const stage = (
  track: RollTrack,
  elapsed: number,
  { reducedMotion = false }: Manner = {},
): Staging => {
  const pushes = [...track.nudged.values(), ...track.toppled.values()];
  const impact = Math.min(...pushes.map(({ at }) => at));
  const pinAt = (pin: Pin, spot: Spot): PinStaging => {
    const push = track.toppled.get(pin);
    if (push) {
      const at = Math.max(push.at, impact + rowOf(pin) * ROW_MS);
      const pose = track.poses.get(pin) ?? spot;
      return fall(pose, { ...push, at }, elapsed, reducedMotion);
    }
    const nudge = track.nudged.get(pin);
    if (nudge && !reducedMotion) return wobble(spot, nudge, elapsed);
    return upright(spot);
  };
  const pins = new Map(
    [...track.spots].map(([pin, spot]) => [pin, pinAt(pin, spot)] as const),
  );
  const ball = {
    ...track.ball,
    roll: track.travelled / BALL_RADIUS,
    spin: (SPIN_RATE * track.spin * elapsed) / 1000,
    gutter: track.gutter,
  };
  const still = ({ state }: PinStaging) =>
    state === "standing" || state === "removed";
  const done = track.knocked !== undefined && [...pins.values()].every(still);
  return { pins, ball, done };
};

export const atRest = (standing: readonly Pin[], ball: Spot): Staging => {
  const swipe = { release: ball.x, direction: 0, speed: 0, spin: 0 };
  return stage({ ...trackRoll(standing, swipe), ball, knocked: [] }, 0);
};
