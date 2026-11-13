import { Frame } from "./frame.js";

export class Game {
  private rolls: number[] = [];

  roll(pins: number): void {
    if (this.isComplete()) {
      throw new Error("Game is already complete");
    }
    this.rolls.push(pins);
  }

  get currentFrame(): number {
    if (this.isComplete()) {
      return 10;
    }
    return Math.min(10, Math.floor(this.rolls.length / 2) + 1);
  }

  get currentRoll(): number {
    if (this.isComplete()) {
      return 2;
    }
    return (this.rolls.length % 2) + 1;
  }

  score(): number {
    return this.rolls.reduce((sum, pins) => sum + pins, 0);
  }

  isComplete(): boolean {
    return this.rolls.length >= 20;
  }

  get frames(): Frame[] {
    const frames: Frame[] = [];
    let runningTotal = 0;
    let rollIndex = 0;

    for (let frameIndex = 1; frameIndex <= 10; frameIndex++) {
      const frameRolls: number[] = [];

      for (let r = 0; r < 2 && rollIndex < this.rolls.length; r++) {
        frameRolls.push(this.rolls[rollIndex++]);
      }

      const isComplete = frameRolls.length === 2;
      let cumulativeScore: number | null = null;

      if (isComplete) {
        runningTotal += frameRolls.reduce((sum, p) => sum + p, 0);
        cumulativeScore = runningTotal;
      }

      frames.push({
        frameNumber: frameIndex,
        rolls: frameRolls,
        isComplete,
        cumulativeScore,
      });
    }

    return frames;
  }

  cumulativeScores(): (number | null)[] {
    return this.frames.map((frame) => frame.cumulativeScore);
  }
}
