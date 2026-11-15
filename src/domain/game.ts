import type { Frame, FrameNumber, PinCount } from "./frame.js";

type RollValidationFailure =
  | { type: "GAME_COMPLETE" }
  | { type: "EXCEEDS_REMAINING_PINS"; remainingPins: PinCount };

export type RollValidationResult =
  | { valid: true; pins: PinCount }
  | { valid: false; failure: RollValidationFailure };

const standing = (knocked: PinCount): PinCount => (10 - knocked) as PinCount;

export class Game {
  private rolls: PinCount[] = [];

  get isFreshRack(): boolean {
    const activeFrame = this.frames.find((f) => !f.isComplete);
    if (!activeFrame) {
      return false;
    }
    if (activeFrame.frameNumber < 10) {
      return activeFrame.rolls.length === 0;
    }

    // Tenth Frame
    const rolls = activeFrame.rolls;
    if (rolls.length === 0) {
      return true;
    }
    if (rolls.length === 1) {
      return rolls[0] === 10;
    }
    // An active Tenth Frame never holds three rolls.
    return rolls[0] === 10 ? rolls[1] === 10 : rolls[0] + rolls[1] === 10;
  }

  validateRoll(pins: PinCount): RollValidationResult {
    if (this.isComplete()) {
      return { valid: false, failure: { type: "GAME_COMPLETE" } };
    }

    const remaining = this.remainingPins;
    if (pins > remaining) {
      return {
        valid: false,
        failure: { type: "EXCEEDS_REMAINING_PINS", remainingPins: remaining },
      };
    }

    return { valid: true, pins };
  }

  roll(pins: PinCount): void {
    const result = this.validateRoll(pins);
    if (!result.valid) {
      const f = result.failure;
      switch (f.type) {
        case "GAME_COMPLETE":
          throw new Error("Game is already complete");
        case "EXCEEDS_REMAINING_PINS":
          throw new Error(
            `Pin count exceeds remaining pins: ${pins} > ${f.remainingPins}`,
          );
      }
    }

    this.rolls.push(result.pins);
  }

  canUndo(): boolean {
    return this.rolls.length > 0;
  }

  undo(): boolean {
    if (this.rolls.length === 0) {
      return false;
    }
    this.rolls.pop();
    return true;
  }

  get remainingPins(): PinCount {
    const activeFrame = this.frames.find((f) => !f.isComplete);
    if (!activeFrame) {
      return 0;
    }

    if (activeFrame.frameNumber < 10) {
      if (activeFrame.rolls.length === 0) {
        return 10;
      }
      return standing(activeFrame.rolls[0]);
    }

    // Tenth Frame
    const rolls = activeFrame.rolls;
    if (rolls.length === 0) {
      return 10;
    }
    if (rolls.length === 1) {
      return rolls[0] === 10 ? 10 : standing(rolls[0]);
    }
    if (rolls[0] === 10) {
      return rolls[1] === 10 ? 10 : standing(rolls[1]);
    }
    // Spare on first two rolls
    return 10;
  }

  get currentFrame(): FrameNumber {
    const activeFrame = this.frames.find((f) => !f.isComplete);
    if (!activeFrame) {
      return 10;
    }
    return activeFrame.frameNumber;
  }

  get currentRoll(): number {
    const activeFrame = this.frames.find((f) => !f.isComplete);
    if (!activeFrame) {
      return 2;
    }
    return activeFrame.rolls.length + 1;
  }

  score(): number {
    const scores = this.cumulativeScores();
    for (let i = scores.length - 1; i >= 0; i--) {
      const score = scores[i];
      if (score !== null) {
        return score;
      }
    }
    return 0;
  }

  isComplete(): boolean {
    return this.frames.every((f) => f.isComplete);
  }

  get frames(): readonly Frame[] {
    const frameData: {
      frameNumber: FrameNumber;
      rolls: PinCount[];
      isComplete: boolean;
      startIndex: number;
    }[] = [];
    let rollIndex = 0;

    for (let frameIndex = 1; frameIndex <= 10; frameIndex++) {
      const startIndex = rollIndex;
      const frameRolls: PinCount[] = [];

      if (frameIndex < 10) {
        if (rollIndex < this.rolls.length) {
          const first = this.rolls[rollIndex++];
          frameRolls.push(first);
          if (first < 10 && rollIndex < this.rolls.length) {
            frameRolls.push(this.rolls[rollIndex++]);
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
        if (rollIndex < this.rolls.length) {
          const first = this.rolls[rollIndex++];
          frameRolls.push(first);

          if (rollIndex < this.rolls.length) {
            const second = this.rolls[rollIndex++];
            frameRolls.push(second);

            const earnsThirdRoll = first === 10 || first + second === 10;
            if (earnsThirdRoll && rollIndex < this.rolls.length) {
              frameRolls.push(this.rolls[rollIndex++]);
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

    // Calculate frame scores
    const frameScores: (number | null)[] = frameData.map((f, i) => {
      if (!f.isComplete) {
        return null;
      }

      if (i < 9) {
        // Strike
        if (f.rolls.length === 1 && f.rolls[0] === 10) {
          if (this.rolls.length >= f.startIndex + 3) {
            return (
              10 + this.rolls[f.startIndex + 1] + this.rolls[f.startIndex + 2]
            );
          }
          return null;
        }

        // Spare
        if (f.rolls.length === 2 && f.rolls[0] + f.rolls[1] === 10) {
          if (this.rolls.length >= f.startIndex + 3) {
            return 10 + this.rolls[f.startIndex + 2];
          }
          return null;
        }

        // Open frame
        return f.rolls[0] + f.rolls[1];
      }

      // 10th frame
      return f.rolls.reduce<number>((sum, r) => sum + r, 0);
    });

    // Calculate cumulative scores
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
  }

  cumulativeScores(): (number | null)[] {
    return this.frames.map((frame) => frame.cumulativeScore);
  }
}
