import type { Pin } from "@bowling/domain";
import { flashAt, RETURN_MS, shoot } from "./camera-motion.js";
import { type Celebration, celebrate } from "./celebration.js";
import { knockedPins, type Pose, rack, type Spot } from "./knock.js";
import { BALL_RADIUS, FOUL_LINE, LANE_WIDTH } from "./lane-geometry.js";
import type { LaneCamera } from "./lane-projection.js";
import { type PinStaging, type Push, stagePins } from "./pin-motion.js";
import type { Swipe } from "./swipe.js";

export type { PinStaging } from "./pin-motion.js";

export interface BallStaging extends Spot {
  roll: number;
  spin: number;
  gutter: boolean;
}

export interface Staging {
  pins: ReadonlyMap<Pin, PinStaging>;
  ball: BallStaging;
  camera: LaneCamera;
  flash: number;
  celebration?: Celebration;
  done: boolean;
}

export interface Moment {
  elapsed: number;
  ball: Pose;
  pins: ReadonlyMap<Pin, Pose>;
}

export interface RollRecord {
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

// Hand-tuned: radians per second at full spin.
const SPIN_RATE = 4 * Math.PI;
// Below these a Pin is untouched, not nudged.
const TOUCHED = 0.002;
const TURNED = 0.01;

export const recordRoll = (
  standing: readonly Pin[],
  swipe: Swipe,
): RollRecord => ({
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

export const observe = (record: RollRecord, moment: Moment): RollRecord => {
  const { elapsed, pins: poses, ball } = moment;
  const nudged = new Map(record.nudged);
  const toppled = new Map(record.toppled);
  const knocked = knockedPins(record.spots, poses);
  for (const [pin, spot] of record.spots) {
    const pose = poses.get(pin);
    if (!pose) continue;
    if (!nudged.has(pin) && touched(spot, pose)) {
      nudged.set(pin, pushOf(spot, pose, elapsed));
    }
    if (!toppled.has(pin) && knocked.includes(pin)) {
      toppled.set(pin, pushOf(spot, pose, elapsed));
    }
  }
  const moved = Math.hypot(ball.x - record.ball.x, ball.y - record.ball.y);
  return {
    ...record,
    elapsed,
    ball: { x: ball.x, y: ball.y },
    travelled: record.travelled + moved,
    gutter: record.gutter || Math.abs(ball.x) > LANE_WIDTH / 2,
    poses,
    nudged,
    toppled,
  };
};

// The outcome is what counts: only the Pins it knocked fall.
export const settle = (
  record: RollRecord,
  knocked: readonly Pin[],
): RollRecord => {
  const fallen = (pin: Pin): Push =>
    record.toppled.get(pin) ?? {
      at: record.elapsed,
      direction: record.nudged.get(pin)?.direction ?? 0,
    };
  const toppled = new Map(knocked.map((pin) => [pin, fallen(pin)]));
  return { ...record, knocked, toppled };
};

export interface Manner {
  reducedMotion?: boolean;
}

export const stage = (
  record: RollRecord,
  elapsed: number,
  { reducedMotion = false }: Manner = {},
): Staging => {
  const { pins, impact, stillAt } = stagePins(record, elapsed, reducedMotion);
  const ball = {
    ...record.ball,
    roll: record.travelled / BALL_RADIUS,
    spin: (SPIN_RATE * record.spin * elapsed) / 1000,
    gutter: record.gutter,
  };
  const settled = record.knocked !== undefined;
  const since = elapsed - impact;
  const sinceStill = settled
    ? elapsed - Math.max(record.elapsed, stillAt)
    : -Infinity;
  const celebration =
    record.knocked &&
    celebrate(
      record.spots.size,
      record.knocked.length,
      elapsed - record.elapsed,
      reducedMotion,
    );
  return {
    pins,
    ball,
    camera: shoot(record.ball.y, since, sinceStill, reducedMotion),
    flash: flashAt(since, reducedMotion),
    celebration,
    done: sinceStill >= RETURN_MS,
  };
};

export const atRest = (standing: readonly Pin[], ball: Spot): Staging => {
  const swipe = { release: ball.x, direction: 0, speed: 0, spin: 0 };
  return { ...stage({ ...recordRoll(standing, swipe), ball }, 0), done: true };
};
