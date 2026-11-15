import { exit, pulse } from "./easing.js";
import { FOUL_LINE, HEAD_PIN } from "./lane-geometry.js";
import { type LaneCamera, REST_CAMERA } from "./lane-projection.js";

// Stopping at the foul line keeps the whole rack in view.
const STOP = FOUL_LINE;
const NUDGE = 0.06;
const NUDGE_IN_MS = 180;
const NUDGE_OUT_MS = 420;
const FLASH_MS = 80;
export const RETURN_MS = 600;

const follow = (ball: number): LaneCamera => {
  const run = (ball - FOUL_LINE) / (HEAD_PIN - FOUL_LINE);
  const share = exit(Math.max(0, Math.min(1, run)));
  return { ...REST_CAMERA, y: REST_CAMERA.y + (STOP - REST_CAMERA.y) * share };
};

const nudgeAt = (since: number) => {
  if (since < 0) return 0;
  if (since < NUDGE_IN_MS) return exit(since / NUDGE_IN_MS);
  return 1 - pulse(Math.min(1, (since - NUDGE_IN_MS) / NUDGE_OUT_MS));
};

const closer = (camera: LaneCamera, share: number): LaneCamera => {
  const tilt = (camera.tilt * Math.PI) / 180;
  const push = NUDGE * share * camera.height;
  return {
    ...camera,
    y: camera.y + push / Math.tan(tilt),
    height: camera.height - push,
  };
};

export const shoot = (
  ball: number,
  sinceImpact: number,
  sinceStill: number,
  reducedMotion: boolean,
): LaneCamera => {
  if (reducedMotion) return REST_CAMERA;
  const away = closer(follow(ball), nudgeAt(sinceImpact));
  if (sinceStill <= 0) return away;
  const back = exit(sinceStill / RETURN_MS);
  const towards = (from: number, to: number) => from + (to - from) * back;
  return {
    ...away,
    y: towards(away.y, REST_CAMERA.y),
    height: towards(away.height, REST_CAMERA.height),
  };
};

export const flashAt = (sinceImpact: number, reducedMotion: boolean) =>
  reducedMotion || sinceImpact < 0 || sinceImpact >= FLASH_MS
    ? 0
    : 1 - sinceImpact / FLASH_MS;
