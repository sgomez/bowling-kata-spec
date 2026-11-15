import { describe, expect, it } from "vitest";
import { Game } from "../../src/domain/game.js";

describe("Game validation", () => {
  it("throws an error if roll is attempted after game is complete", () => {
    const game = new Game();
    for (let i = 0; i < 20; i++) {
      game.roll(0);
    }
    expect(game.isComplete()).toBe(true);
    expect(() => game.roll(1)).toThrow("Game is already complete");
  });

  it("rejects pin count exceeding remaining pins in frames 1-9", () => {
    const game = new Game();
    game.roll(6);
    expect(game.remainingPins).toBe(4);
    expect(() => game.roll(5)).toThrow();

    // Valid roll within remaining pins works
    game.roll(3);
    expect(game.frames[0].rolls).toEqual([6, 3]);
  });

  it("rejects pin count exceeding remaining pins in the tenth frame", () => {
    const game = new Game();
    for (let i = 0; i < 18; i++) {
      game.roll(0);
    }
    expect(game.currentFrame).toBe(10);
    game.roll(8);
    expect(game.remainingPins).toBe(2);
    expect(() => game.roll(3)).toThrow();

    // Valid roll of 2 completes the frame with a spare
    game.roll(2);
    expect(game.remainingPins).toBe(10);
  });

  it("accepts 10 pins on roll 2 after a 0-pin first roll as a spare", () => {
    const game = new Game();
    game.roll(0);
    expect(game.currentRoll).toBe(2);
    expect(game.remainingPins).toBe(10);

    // Roll 2 knocks down all remaining 10 pins
    game.roll(10);
    expect(game.frames[0].rolls).toEqual([0, 10]);
    expect(game.frames[0].isComplete).toBe(true);
    expect(game.currentFrame).toBe(2);
    expect(game.currentRoll).toBe(1);

    // Next roll provides bonus to the spare
    game.roll(5);
    expect(game.frames[0].cumulativeScore).toBe(15);
  });

  it("accepts 10 pins on roll 2 in tenth frame after a 0-pin first roll, awarding a third roll", () => {
    const game = new Game();
    for (let i = 0; i < 18; i++) {
      game.roll(0);
    }
    expect(game.currentFrame).toBe(10);
    expect(game.currentRoll).toBe(1);

    game.roll(0);
    expect(game.currentRoll).toBe(2);
    expect(game.remainingPins).toBe(10);

    // Spare on roll 2
    game.roll(10);
    expect(game.frames[9].rolls).toEqual([0, 10]);
    expect(game.currentRoll).toBe(3);
    expect(game.isComplete()).toBe(false);

    // Bonus roll on roll 3
    game.roll(10);
    expect(game.frames[9].rolls).toEqual([0, 10, 10]);
    expect(game.isComplete()).toBe(true);
    expect(game.score()).toBe(20);
  });

  it("accepts 10 pins on roll 3 in tenth frame after a strike and 0-pin roll", () => {
    const game = new Game();
    for (let i = 0; i < 18; i++) {
      game.roll(0);
    }
    game.roll(10); // Roll 1: Strike
    game.roll(0); // Roll 2: 0 pins
    expect(game.currentRoll).toBe(3);
    expect(game.remainingPins).toBe(10);

    // Roll 3: Spare
    game.roll(10);
    expect(game.frames[9].rolls).toEqual([10, 0, 10]);
    expect(game.isComplete()).toBe(true);
    expect(game.score()).toBe(20);
  });
});
