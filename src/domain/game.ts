import type { Frame } from "./frame.js";

export type RollValidationFailure =
  | { type: "GAME_COMPLETE" }
  | { type: "INVALID_FORMAT"; input: unknown }
  | { type: "PINS_OUT_OF_RANGE"; pinCount: number }
  | { type: "STRIKE_ON_SECOND_ROLL" }
  | { type: "STRIKE_FEWER_PINS" }
  | { type: "SPARE_ON_FIRST_ROLL" }
  | { type: "SPARE_ON_FRESH_RACK" }
  | { type: "EXCEEDS_REMAINING_PINS"; remainingPins: number };

export type RollValidationResult =
  | { valid: true; pins: number }
  | { valid: false; failure: RollValidationFailure };

export class Game {
  private rolls: number[] = [];

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
    if (rolls.length === 2) {
      return rolls[0] === 10 ? rolls[1] === 10 : rolls[0] + rolls[1] === 10;
    }
    return false;
  }

  validateRoll(pins: number | string): RollValidationResult {
    if (this.isComplete()) {
      return { valid: false, failure: { type: "GAME_COMPLETE" } };
    }

    const remaining = this.remainingPins;
    let pinCount: number;

    if (typeof pins === "string") {
      const trimmed = pins.trim().toUpperCase();
      if (trimmed === "X") {
        if (!this.isFreshRack) {
          if (this.currentFrame < 10) {
            return { valid: false, failure: { type: "STRIKE_ON_SECOND_ROLL" } };
          }
          if (remaining !== 10) {
            return { valid: false, failure: { type: "STRIKE_FEWER_PINS" } };
          }
          return { valid: false, failure: { type: "STRIKE_ON_SECOND_ROLL" } };
        }
        pinCount = 10;
      } else if (trimmed === "/") {
        if (this.isFreshRack) {
          if (this.currentRoll === 1) {
            return { valid: false, failure: { type: "SPARE_ON_FIRST_ROLL" } };
          }
          return { valid: false, failure: { type: "SPARE_ON_FRESH_RACK" } };
        }
        pinCount = remaining;
      } else if (trimmed === "-") {
        pinCount = 0;
      } else {
        if (!/^\d+$/.test(trimmed)) {
          return {
            valid: false,
            failure: { type: "INVALID_FORMAT", input: pins },
          };
        }
        pinCount = parseInt(trimmed, 10);
      }
    } else {
      if (!Number.isInteger(pins)) {
        return {
          valid: false,
          failure: { type: "INVALID_FORMAT", input: pins },
        };
      }
      pinCount = pins;
    }

    if (pinCount < 0 || pinCount > 10) {
      return { valid: false, failure: { type: "PINS_OUT_OF_RANGE", pinCount } };
    }

    if (pinCount > remaining) {
      return {
        valid: false,
        failure: { type: "EXCEEDS_REMAINING_PINS", remainingPins: remaining },
      };
    }

    return { valid: true, pins: pinCount };
  }

  roll(pins: number | string): void {
    const result = this.validateRoll(pins);
    if (!result.valid) {
      const f = result.failure;
      switch (f.type) {
        case "GAME_COMPLETE":
          throw new Error("Game is already complete");
        case "INVALID_FORMAT":
          throw new Error(`Invalid roll input: ${pins}`);
        case "PINS_OUT_OF_RANGE":
          throw new Error(`Invalid pin count: ${f.pinCount}`);
        case "STRIKE_ON_SECOND_ROLL":
          throw new Error(
            this.currentFrame < 10
              ? "Cannot roll a strike on the second roll of frames 1-9"
              : "Cannot roll a strike on the second roll of a frame",
          );
        case "STRIKE_FEWER_PINS":
          throw new Error(
            "Cannot roll a strike when fewer than 10 pins are standing",
          );
        case "SPARE_ON_FIRST_ROLL":
          throw new Error("Cannot roll a spare on the first roll");
        case "SPARE_ON_FRESH_RACK":
          throw new Error("Cannot roll a spare when all pins are reset");
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

  get remainingPins(): number {
    const activeFrame = this.frames.find((f) => !f.isComplete);
    if (!activeFrame) {
      return 0;
    }

    if (activeFrame.frameNumber < 10) {
      if (activeFrame.rolls.length === 0) {
        return 10;
      }
      return 10 - activeFrame.rolls[0];
    }

    // Tenth Frame
    const rolls = activeFrame.rolls;
    if (rolls.length === 0) {
      return 10;
    }
    if (rolls.length === 1) {
      return rolls[0] === 10 ? 10 : 10 - rolls[0];
    }
    if (rolls.length === 2) {
      if (rolls[0] === 10) {
        return rolls[1] === 10 ? 10 : 10 - rolls[1];
      }
      // Spare on first two rolls
      return 10;
    }
    return 0;
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
        if (f.rolls.length === 2) {
          return f.rolls[0] + f.rolls[1];
        }

        return null;
      } else {
        // 10th frame
        if (!f.isComplete) {
          return null;
        }
        return f.rolls.reduce((sum, r) => sum + r, 0);
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
