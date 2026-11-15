import { type FrameNumber, TENTH_FRAME } from "./frame.js";

const FRAME_WINDOW_MS = 30_000;
const TENTH_FRAME_WINDOW_MS = 45_000;
const LATE_ROLL_GRACE_MS = 500;
const REVEAL_MS = 5_000;

export type FrameWindow =
  | { frame: FrameNumber; open: true; deadline: number }
  | { frame: FrameNumber; open: false; opensNextAt: number };

export const openWindow = (frame: FrameNumber, now: number): FrameWindow => ({
  frame,
  open: true,
  deadline:
    now + (frame === TENTH_FRAME ? TENTH_FRAME_WINDOW_MS : FRAME_WINDOW_MS),
});

export const revealWindow = (frame: FrameNumber, now: number): FrameWindow => ({
  frame,
  open: false,
  opensNextAt: now + REVEAL_MS,
});

export const acceptsRollAt = (window: FrameWindow, now: number) =>
  window.open && now <= window.deadline + LATE_ROLL_GRACE_MS;

export const dueAt = (window: FrameWindow) =>
  window.open ? window.deadline + LATE_ROLL_GRACE_MS : window.opensNextAt;

export const windowView = (window: FrameWindow, now: number) => ({
  number: window.frame,
  open: window.open,
  remainingMs: Math.max(
    0,
    (window.open ? window.deadline : window.opensNextAt) - now,
  ),
});
