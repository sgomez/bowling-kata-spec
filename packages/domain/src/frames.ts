import {
  type Frame,
  type FrameNumber,
  PINS_PER_RACK,
  type PinCount,
  TENTH_FRAME,
} from "./frame.js";

interface GroupedFrame {
  frameNumber: FrameNumber;
  rolls: PinCount[];
  isComplete: boolean;
  firstRollIndex: number;
}

const takeRegularFrameRolls = (
  rolls: readonly PinCount[],
  start: number,
): PinCount[] => {
  if (start >= rolls.length) {
    return [];
  }
  const first = rolls[start];
  if (first === PINS_PER_RACK || start + 1 >= rolls.length) {
    return [first];
  }
  return [first, rolls[start + 1]];
};

const takeTenthFrameRolls = (
  rolls: readonly PinCount[],
  start: number,
): PinCount[] => {
  const [first, second, third] = rolls.slice(start, start + 3);
  if (second === undefined) {
    return first === undefined ? [] : [first];
  }
  const earnsBonusRoll =
    first === PINS_PER_RACK || first + second === PINS_PER_RACK;
  return earnsBonusRoll && third !== undefined
    ? [first, second, third]
    : [first, second];
};

const isRegularFrameComplete = (frameRolls: readonly PinCount[]): boolean =>
  frameRolls[0] === PINS_PER_RACK || frameRolls.length === 2;

const isTenthFrameComplete = (frameRolls: readonly PinCount[]): boolean =>
  frameRolls.length === 3 ||
  (frameRolls.length === 2 && frameRolls[0] + frameRolls[1] < PINS_PER_RACK);

const groupIntoFrames = (rolls: readonly PinCount[]): GroupedFrame[] => {
  const frames: GroupedFrame[] = [];
  let rollIndex = 0;

  for (let frameNumber = 1; frameNumber <= TENTH_FRAME; frameNumber++) {
    const isTenth = frameNumber === TENTH_FRAME;
    const frameRolls = isTenth
      ? takeTenthFrameRolls(rolls, rollIndex)
      : takeRegularFrameRolls(rolls, rollIndex);

    frames.push({
      frameNumber: frameNumber as FrameNumber,
      rolls: frameRolls,
      isComplete: isTenth
        ? isTenthFrameComplete(frameRolls)
        : isRegularFrameComplete(frameRolls),
      firstRollIndex: rollIndex,
    });
    rollIndex += frameRolls.length;
  }

  return frames;
};

const frameScore = (
  frame: GroupedFrame,
  allRolls: readonly PinCount[],
): number | null => {
  if (!frame.isComplete) {
    return null;
  }

  const pinsInFrame = frame.rolls.reduce<number>((sum, r) => sum + r, 0);
  const isTenthFrame = frame.frameNumber === TENTH_FRAME;
  if (isTenthFrame || pinsInFrame < PINS_PER_RACK) {
    return pinsInFrame;
  }

  const isStrike = frame.rolls.length === 1;
  const bonusRollCount = isStrike ? 2 : 1;
  const bonusStart = frame.firstRollIndex + frame.rolls.length;
  const bonusRolls = allRolls.slice(bonusStart, bonusStart + bonusRollCount);
  if (bonusRolls.length < bonusRollCount) {
    return null;
  }
  return PINS_PER_RACK + bonusRolls.reduce<number>((sum, r) => sum + r, 0);
};

export const buildFrames = (rolls: readonly PinCount[]): Frame[] => {
  const groupedFrames = groupIntoFrames(rolls);
  const frameScores = groupedFrames.map((f) => frameScore(f, rolls));

  let runningTotal = 0;
  let unresolved = false;

  return groupedFrames.map((f, i) => {
    const score = frameScores[i];
    let cumulativeScore: number | null = null;

    if (unresolved || score === null) {
      unresolved = true;
    } else {
      runningTotal += score;
      cumulativeScore = runningTotal;
    }

    return {
      frameNumber: f.frameNumber,
      rolls: f.rolls,
      isComplete: f.isComplete,
      cumulativeScore,
    };
  });
};
