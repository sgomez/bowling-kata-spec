import type { Spot } from "./knock.js";
import { FOUL_LINE, HEAD_PIN, LANE_WIDTH } from "./lane-geometry.js";
import type { Swipe } from "./swipe.js";

// Sideways pull per unit of spin, shared with the physics so the aim tells the truth.
export const HOOK = 2.5;

const STEP = 0.02;
const EDGE = LANE_WIDTH / 2;

// The hook turns the ball at a constant rate, so the path is an arc.
export const aimOf = ({ release, direction, speed, spin }: Swipe): Spot[] => {
  const bend = (HOOK * spin) / speed;
  const aim: Spot[] = [{ x: release, y: FOUL_LINE }];
  let { x, y } = aim[0] as Spot;
  let heading = direction;
  while (Math.cos(heading) > 0) {
    const turn = heading + (bend * STEP) / 2;
    const next = { x: x + STEP * Math.sin(turn), y: y + STEP * Math.cos(turn) };
    const over = Math.max(
      (next.y - HEAD_PIN) / (next.y - y),
      (Math.abs(next.x) - EDGE) / Math.abs(next.x - x),
    );
    if (over >= 0) {
      aim.push({
        x: next.x - over * (next.x - x),
        y: next.y - over * (next.y - y),
      });
      break;
    }
    aim.push(next);
    ({ x, y } = next);
    heading += bend * STEP;
  }
  return aim;
};
