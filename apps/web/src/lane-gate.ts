import type { Spot } from "./knock.js";
import { FOUL_LINE, LANE_WIDTH } from "./lane-geometry.js";
import type { Viewport } from "./lane-projection.js";

export type LaneActivity = "idle" | "aiming" | "rolling";

interface FrameTime {
  now: number;
  endsAt: number;
}

type TimeCheck = "running" | "over" | "missed";

export const checkTime = (
  activity: LaneActivity,
  { now, endsAt }: FrameTime,
): TimeCheck => {
  if (now < endsAt) return "running";
  return activity === "idle" ? "over" : "missed";
};

export const canStartSwipe = (
  activity: LaneActivity,
  time: FrameTime,
  start: Spot | undefined,
): boolean =>
  checkTime(activity, time) === "running" &&
  activity !== "rolling" &&
  start !== undefined &&
  onApproach(start);

const onApproach = ({ x, y }: Spot) =>
  Math.abs(x) <= LANE_WIDTH / 2 && y >= 0 && y <= FOUL_LINE;

// Share of the screen, from the bottom, a Swipe may cover without a Foul.
const SWIPE_LIMIT = 2 / 5;

export const pastSwipeLimit = (y: number, { top, height }: Viewport) =>
  top + height - y > height * SWIPE_LIMIT;
