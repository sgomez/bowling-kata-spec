import { BALL_RADIUS, LANE_LENGTH, LANE_WIDTH } from "./lane-geometry.js";

export interface SwipeSample {
  x: number;
  y: number;
  t: number;
}

export interface Swipe {
  release: number;
  direction: number;
  speed: number;
  spin: number;
}

// Hand-tuned on a phone.
const RELEASE_WINDOW_MS = 100;
const SPIN_GAIN = 4;
const MIN_LENGTH = 0.05;
const MIN_SPEED = 0.5;
const MAX_SPEED = 6;
const MAX_DIRECTION = 0.35;
const MAX_RELEASE = LANE_WIDTH / 2 - BALL_RADIUS;

const clamp = (value: number, limit: number) =>
  Math.max(-limit, Math.min(limit, value));

const releaseSample = (samples: readonly SwipeSample[], last: SwipeSample) => {
  let from = samples[0] as SwipeSample;
  for (const sample of samples) {
    if (sample.t <= last.t - RELEASE_WINDOW_MS) from = sample;
  }
  return from;
};

const bow = (
  samples: readonly SwipeSample[],
  first: SwipeSample,
  dx: number,
  dy: number,
) => {
  const length = Math.hypot(dx, dy);
  let deepest = 0;
  for (const p of samples) {
    const offset = (dx * (p.y - first.y) - dy * (p.x - first.x)) / length;
    if (Math.abs(offset) > Math.abs(deepest)) deepest = offset;
  }
  return deepest / length;
};

export const readSwipe = (
  samples: readonly SwipeSample[],
): Swipe | undefined => {
  const first = samples[0];
  const last = samples.at(-1);
  if (!first || !last) return undefined;
  const dx = last.x - first.x;
  const dy = last.y - first.y;
  if (dy <= 0 || Math.hypot(dx, dy) < MIN_LENGTH) return undefined;
  const from = releaseSample(samples, last);
  const speed =
    (Math.hypot(last.x - from.x, last.y - from.y) / (last.t - from.t)) * 1000;
  if (speed < MIN_SPEED) return undefined;
  return {
    release: clamp(last.x, MAX_RELEASE),
    direction: clamp(Math.atan2(dx, dy), MAX_DIRECTION),
    speed: Math.min(speed, MAX_SPEED),
    spin: clamp(bow(samples, first, dx, dy) * SPIN_GAIN, 1),
  };
};

interface Touch {
  clientX: number;
  clientY: number;
  timeStamp: number;
}

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const toLane = (touch: Touch, rect: Rect): SwipeSample => ({
  x: ((touch.clientX - rect.left) / rect.width - 0.5) * LANE_WIDTH,
  y: ((rect.top + rect.height - touch.clientY) / rect.height) * LANE_LENGTH,
  t: touch.timeStamp,
});
