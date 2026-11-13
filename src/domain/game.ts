import { Frame } from "./frame.js";

export class Game {
  private rolls: number[] = [];

  roll(pins: number | string): void {
    if (this.isComplete()) {
      throw new Error("Game is already complete");
    }

    let pinCount: number;

    if (typeof pins === "string") {
      const trimmed = pins.trim().toUpperCase();
      if (trimmed === "X") {
        if (this.currentRoll !== 1 && this.currentFrame < 10) {
          throw new Error("Cannot roll a strike on the second roll of frames 1-9");
        }
        pinCount = 10;
      } else if (trimmed === "/") {
        if (this.currentRoll !== 2) {
          throw new Error("Cannot roll a spare on the first roll");
        }
        const currentFrameRolls = this.frames[this.currentFrame - 1].rolls;
        pinCount = 10 - currentFrameRolls[0];
      } else {
        const parsed = parseInt(trimmed, 10);
        if (isNaN(parsed)) {
          throw new Error(`Invalid roll input: ${pins}`);
        }
        pinCount = parsed;
      }
    } else {
      pinCount = pins;
    }

    this.rolls.push(pinCount);
  }

  get currentFrame(): number {
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
      if (scores[i] !== null) {
        return scores[i]!;
      }
    }
    return 0;
  }

  isComplete(): boolean {
    return this.frames.every((f) => f.isComplete);
  }

  get frames(): Frame[] {
    const frameData: {
      frameNumber: number;
      rolls: number[];
      isComplete: boolean;
      startIndex: number;
    }[] = [];
    let rollIndex = 0;

    for (let frameIndex = 1; frameIndex <= 10; frameIndex++) {
      const startIndex = rollIndex;
      const frameRolls: number[] = [];

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
          frameNumber: frameIndex,
          rolls: frameRolls,
          isComplete,
          startIndex,
        });
      } else {
        while (frameRolls.length < 2 && rollIndex < this.rolls.length) {
          frameRolls.push(this.rolls[rollIndex++]);
        }

        const isComplete = frameRolls.length === 2;

        frameData.push({
          frameNumber: frameIndex,
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
            return 10 + this.rolls[f.startIndex + 1] + this.rolls[f.startIndex + 2];
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
        if (f.rolls.length === 2) {
          return f.rolls[0] + f.rolls[1];
        }

        return null;
      } else {
        // 10th frame (open frame for now)
        if (f.rolls.length === 2) {
          return f.rolls[0] + f.rolls[1];
        }
        return null;
      }
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
