import { type FrameNumber, TENTH_FRAME } from "@bowling/domain";
import { clearsRack } from "./roll-kind.js";

export const rollsOfFrame = (frame: FrameNumber, rolls: readonly string[]) => {
  const earnedBonus = frame === TENTH_FRAME && rolls.some(clearsRack);
  const of = earnedBonus ? 3 : 2;
  return { next: Math.min(rolls.length + 1, of), of };
};
