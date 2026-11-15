import type { Frame, FrameNumber, PinCount } from "./frame.js";
import { buildFrames } from "./frames.js";

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
    return buildFrames(this.rolls);
  }

  cumulativeScores(): (number | null)[] {
    return this.frames.map((frame) => frame.cumulativeScore);
  }
}
