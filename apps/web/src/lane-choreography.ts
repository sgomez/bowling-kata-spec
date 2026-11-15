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

// Hand-tuned: radians per second at full spin.
const SPIN_RATE = 4 * Math.PI;
// Below these a Pin is untouched, not nudged.
const TOUCHED = 0.002;
const TURNED = 0.01;

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
  const { pins, impact, stillAt } = stagePins(track, elapsed, reducedMotion);
  const ball = {
    ...track.ball,
    roll: track.travelled / BALL_RADIUS,
    spin: (SPIN_RATE * track.spin * elapsed) / 1000,
    gutter: track.gutter,
  };
  const settled = track.knocked !== undefined;
  const since = elapsed - impact;
  const sinceStill = settled
    ? elapsed - Math.max(track.elapsed, stillAt)
    : -Infinity;
  const celebration =
    track.knocked &&
    celebrate(
      track.spots.size,
      track.knocked.length,
      elapsed - track.elapsed,
      reducedMotion,
    );
  return {
    pins,
    ball,
    camera: shoot(track.ball.y, since, sinceStill, reducedMotion),
    flash: flashAt(since, reducedMotion),
    celebration,
    done: sinceStill >= RETURN_MS,
  };
};

export const atRest = (standing: readonly Pin[], ball: Spot): Staging => {
  const swipe = { release: ball.x, direction: 0, speed: 0, spin: 0 };
  return { ...stage({ ...trackRoll(standing, swipe), ball }, 0), done: true };
};
