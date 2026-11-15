import { FOUL_LINE } from "./lane-geometry.js";

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
  startY: number,
): boolean =>
  checkTime(activity, time) === "running" &&
  activity !== "rolling" &&
  startY <= FOUL_LINE;
