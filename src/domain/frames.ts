import type { Frame, FrameNumber, PinCount } from "./frame.js";

interface FrameData {
  frameNumber: FrameNumber;
  rolls: PinCount[];
  isComplete: boolean;
  startIndex: number;
}

const groupIntoFrames = (rolls: readonly PinCount[]): FrameData[] => {
  const frameData: FrameData[] = [];
  let rollIndex = 0;

  for (let frameIndex = 1; frameIndex <= 10; frameIndex++) {
    const startIndex = rollIndex;
    const frameRolls: PinCount[] = [];

    if (frameIndex < 10) {
      if (rollIndex < rolls.length) {
        const first = rolls[rollIndex++];
        frameRolls.push(first);
        if (first < 10 && rollIndex < rolls.length) {
          frameRolls.push(rolls[rollIndex++]);
        }
      }

      const isComplete =
        frameRolls.length === 1 && frameRolls[0] === 10
          ? true
          : frameRolls.length === 2;

      frameData.push({
        frameNumber: frameIndex as FrameNumber,
        rolls: frameRolls,
        isComplete,
        startIndex,
      });
    } else {
      if (rollIndex < rolls.length) {
        const first = rolls[rollIndex++];
        frameRolls.push(first);

        if (rollIndex < rolls.length) {
          const second = rolls[rollIndex++];
          frameRolls.push(second);

          const earnsThirdRoll = first === 10 || first + second === 10;
          if (earnsThirdRoll && rollIndex < rolls.length) {
            frameRolls.push(rolls[rollIndex++]);
          }
        }
      }

      const isComplete =
        frameRolls.length === 3 ||
        (frameRolls.length === 2 && frameRolls[0] + frameRolls[1] < 10);

      frameData.push({
        frameNumber: frameIndex as FrameNumber,
        rolls: frameRolls,
        isComplete,
        startIndex,
      });
    }
  }

  return frameData;
};

const frameScore = (
  f: FrameData,
  i: number,
  rolls: readonly PinCount[],
): number | null => {
  if (!f.isComplete) {
    return null;
  }

  if (i < 9) {
    // Strike
    if (f.rolls.length === 1 && f.rolls[0] === 10) {
      if (rolls.length >= f.startIndex + 3) {
        return 10 + rolls[f.startIndex + 1] + rolls[f.startIndex + 2];
      }
      return null;
    }

    // Spare
    if (f.rolls.length === 2 && f.rolls[0] + f.rolls[1] === 10) {
      if (rolls.length >= f.startIndex + 3) {
        return 10 + rolls[f.startIndex + 2];
      }
      return null;
    }

    // Open frame
    return f.rolls[0] + f.rolls[1];
  }

  // 10th frame
  return f.rolls.reduce<number>((sum, r) => sum + r, 0);
};

export const buildFrames = (rolls: readonly PinCount[]): Frame[] => {
  const frameData = groupIntoFrames(rolls);
  const frameScores = frameData.map((f, i) => frameScore(f, i, rolls));

  let runningTotal = 0;
  let unresolved = false;

  return frameData.map((f, i) => {
    const score = frameScores[i];
    let cumulativeScore: number | null = null;

    if (unresolved || score === null) {
      unresolved = true;
      cumulativeScore = null;
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
