import { describe, expect, it } from "vitest";
import { Game } from "../src/game.js";

describe("Game Tenth Frame", () => {
  it("concludes strictly after 2 rolls in the tenth frame if neither strike nor spare (open frame)", () => {
    const game = new Game();
    // Frames 1-9: 18 rolls of 1 (total 18)
    for (let i = 0; i < 18; i++) {
      game.roll(1);
    }
    expect(game.currentFrame).toBe(10);
    expect(game.currentRoll).toBe(1);

    game.roll(4);
    expect(game.currentFrame).toBe(10);
    expect(game.currentRoll).toBe(2);
    expect(game.isComplete()).toBe(false);

    game.roll(3); // Open frame: 4 + 3 = 7
    expect(game.isComplete()).toBe(true);
    expect(game.frames[9].rolls).toEqual([4, 3]);
    expect(game.frames[9].isComplete).toBe(true);
    expect(game.frames[9].cumulativeScore).toBe(25);
    expect(game.score()).toBe(25);

    expect(() => game.roll(1)).toThrow("Game is already complete");
  });

  it("permits a 3rd bonus roll in the tenth frame after a spare", () => {
    const game = new Game();
    // Frames 1-9: gutters
    for (let i = 0; i < 18; i++) {
      game.roll(0);
    }

    game.roll(6);
    game.roll(4); // Spare in frame 10 (4 pins)
    expect(game.currentFrame).toBe(10);
    expect(game.currentRoll).toBe(3);
    expect(game.isComplete()).toBe(false);
    expect(game.frames[9].isComplete).toBe(false);
    expect(game.frames[9].cumulativeScore).toBeNull();

    game.roll(7); // Bonus roll
    expect(game.isComplete()).toBe(true);
    expect(game.frames[9].rolls).toEqual([6, 4, 7]);
    expect(game.frames[9].isComplete).toBe(true);
    expect(game.frames[9].cumulativeScore).toBe(17);
    expect(game.score()).toBe(17);

    expect(() => game.roll(1)).toThrow("Game is already complete");
  });

  it("resets pin rack to 10 after a spare in the tenth frame, permitting a strike on the bonus roll", () => {
    const game = new Game();
    for (let i = 0; i < 18; i++) {
      game.roll(0);
    }

    game.roll(8);
    game.roll(2); // Spare
    game.roll(10); // Strike on bonus roll (10 pins)

    expect(game.isComplete()).toBe(true);
    expect(game.frames[9].rolls).toEqual([8, 2, 10]);
    expect(game.frames[9].cumulativeScore).toBe(20);
    expect(game.score()).toBe(20);
  });

  it("permits 2 bonus rolls in the tenth frame after a strike on roll 1", () => {
    const game = new Game();
    for (let i = 0; i < 18; i++) {
      game.roll(0);
    }

    game.roll(10); // Frame 10, roll 1: Strike
    expect(game.currentFrame).toBe(10);
    expect(game.currentRoll).toBe(2);
    expect(game.isComplete()).toBe(false);

    game.roll(7); // Bonus roll 1
    expect(game.currentFrame).toBe(10);
    expect(game.currentRoll).toBe(3);
    expect(game.isComplete()).toBe(false);

    game.roll(2); // Bonus roll 2
    expect(game.isComplete()).toBe(true);
    expect(game.frames[9].rolls).toEqual([10, 7, 2]);
    expect(game.frames[9].cumulativeScore).toBe(19);
    expect(game.score()).toBe(19);

    expect(() => game.roll(1)).toThrow("Game is already complete");
  });

  it("allows up to 3 strikes in the tenth frame", () => {
    const game = new Game();
    for (let i = 0; i < 18; i++) {
      game.roll(0);
    }

    game.roll(10);
    game.roll(10);
    game.roll(10);

    expect(game.isComplete()).toBe(true);
    expect(game.frames[9].rolls).toEqual([10, 10, 10]);
    expect(game.frames[9].cumulativeScore).toBe(30);
    expect(game.score()).toBe(30);
  });

  it("allows a strike followed by a non-strike and a spare in the tenth frame", () => {
    const game = new Game();
    for (let i = 0; i < 18; i++) {
      game.roll(0);
    }

    game.roll(10);
    game.roll(9);
    game.roll(1); // Spare on remaining 1 pin

    expect(game.isComplete()).toBe(true);
    expect(game.frames[9].rolls).toEqual([10, 9, 1]);
    expect(game.frames[9].cumulativeScore).toBe(20);
    expect(game.score()).toBe(20);
  });
});
