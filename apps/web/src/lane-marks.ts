import type { Spot } from "./knock.js";
import { FOUL_LINE } from "./lane-geometry.js";

// Lane metres; an arrow's y is its tip. Hand-tuned to the "Pista" sheet.
const BOARDS = 0.149;
const CENTRE_ARROW = 1.02;
const ARROW_STEP = 0.045;

export const ARROWS: readonly Spot[] = [-3, -2, -1, 0, 1, 2, 3].map((i) => ({
  x: i * BOARDS,
  y: CENTRE_ARROW - Math.abs(i) * ARROW_STEP,
}));

const laneDots = [-4, -3, -2, -1, 1, 2, 3, 4].map((i) => ({
  x: Math.sign(i) * (0.018 + Math.abs(i) * 0.096),
  y: FOUL_LINE + 0.13,
}));

const approachDots = [-3, -2, -1, 0, 1, 2, 3].map((i) => ({
  x: i * BOARDS,
  y: FOUL_LINE - 0.2,
}));

export const GUIDE_DOTS: readonly Spot[] = [...approachDots, ...laneDots];

const MAX_TRIANGLES = 12_000;
const MAX_DRAW_CALLS = 40;

export const overBudget = (frame: { triangles: number; calls: number }) =>
  frame.triangles >= MAX_TRIANGLES || frame.calls >= MAX_DRAW_CALLS;
