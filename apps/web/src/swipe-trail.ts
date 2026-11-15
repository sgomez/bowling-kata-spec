import { MAX_SPEED, type Swipe } from "./swipe.js";

// Lane metres; hand-tuned so a fast Swipe reads as a thick stroke.
const THIN = 0.02;
const THICK = 0.08;

const FADE_MS = 220;

export const trailWidth = (swipe: Swipe | undefined) =>
  THIN + (THICK - THIN) * Math.min(1, (swipe?.speed ?? 0) / MAX_SPEED);

// Cubic ease-out, close to the exit curve.
export const trailOpacity = (sinceRelease: number) => {
  const left = 1 - Math.min(1, sinceRelease / FADE_MS);
  return left ** 3;
};
