import {
  type Frame,
  type FrameNumber,
  PINS_PER_RACK,
  type PinCount,
  TENTH_FRAME,
} from "./frame.js";
import { buildFrames } from "./frames.js";

type RollValidationFailure =
  | { type: "GAME_COMPLETE" }
  | { type: "EXCEEDS_REMAINING_PINS"; remainingPins: PinCount };

export type RollValidationResult =
  | { valid: true; pins: PinCount }
  | { valid: false; failure: RollValidationFailure };

const standing = (knocked: PinCount): PinCount =>
  (PINS_PER_RACK - knocked) as PinCount;

export class Game {
  private rolls: PinCount[] = [];

  private get activeFrame(): Frame | undefined {
    return this.frames.find((f) => !f.isComplete);
  }

  get isFreshRack(): boolean {
    const activeFrame = this.activeFrame;
    if (!activeFrame) {
      return false;
    }
    if (activeFrame.frameNumber < TENTH_FRAME) {
      return activeFrame.rolls.length === 0;
    }

    const rolls = activeFrame.rolls;
    if (rolls.length === 0) {
      return true;
    }
    if (rolls.length === 1) {
      return rolls[0] === PINS_PER_RACK;
    }
    // An active Tenth Frame never holds three rolls.
    return rolls[0] === PINS_PER_RACK
      ? rolls[1] === PINS_PER_RACK
      : rolls[0] + rolls[1] === PINS_PER_RACK;
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

  get remainingPins(): PinCount {
    const activeFrame = this.activeFrame;
    if (!activeFrame) {
      return 0;
    }

    if (activeFrame.frameNumber < TENTH_FRAME) {
      if (activeFrame.rolls.length === 0) {
        return PINS_PER_RACK;
      }
      return standing(activeFrame.rolls[0]);
    }

    const rolls = activeFrame.rolls;
    if (rolls.length === 0) {
      return PINS_PER_RACK;
    }
    if (rolls.length === 1) {
      return rolls[0] === PINS_PER_RACK ? PINS_PER_RACK : standing(rolls[0]);
    }
    if (rolls[0] === PINS_PER_RACK) {
      return rolls[1] === PINS_PER_RACK ? PINS_PER_RACK : standing(rolls[1]);
    }
    return PINS_PER_RACK;
  }

  get currentFrame(): FrameNumber {
    const activeFrame = this.activeFrame;
    if (!activeFrame) {
      return TENTH_FRAME;
    }
    return activeFrame.frameNumber;
  }

  get currentRoll(): number {
    const activeFrame = this.activeFrame;
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
