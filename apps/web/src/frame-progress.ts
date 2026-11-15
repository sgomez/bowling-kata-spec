import type { FrameNumber } from "@bowling/domain";

const TENTH_FRAME = 10;

export const rollsOfFrame = (frame: FrameNumber, rolls: readonly string[]) => {
  const earnedBonus =
    frame === TENTH_FRAME && rolls.some((roll) => roll === "X" || roll === "/");
  const of = earnedBonus ? 3 : 2;
  return { next: Math.min(rolls.length + 1, of), of };
};
