import { describe, expect, it } from "vitest";
import { Game } from "../src/game.js";

describe("Game spares", () => {
  it("defers spare score calculation until one bonus roll is recorded", () => {
    const game = new Game();
    game.roll(7);
    expect(game.currentFrame).toBe(1);
    expect(game.currentRoll).toBe(2);

    game.roll(3); // Frame 1: spare (7 + 3 = 10)
    expect(game.currentFrame).toBe(2);
    expect(game.currentRoll).toBe(1);
    expect(game.frames[0].isComplete).toBe(true);
    expect(game.frames[0].rolls).toEqual([7, 3]);

    // Frame 1 is complete, but bonus roll not yet thrown
    expect(game.frames[0].cumulativeScore).toBeNull();
    expect(game.cumulativeScores()[0]).toBeNull();

    // Bonus roll (Frame 2, roll 1)
    game.roll(4);
    // Now Frame 1 has 1 bonus roll: 10 + 4 = 14
    expect(game.frames[0].cumulativeScore).toBe(14);
    // Frame 2 is still in progress
    expect(game.frames[1].cumulativeScore).toBeNull();

    // Frame 2, roll 2 (open frame: 4 + 2 = 6)
    game.roll(2);
    expect(game.frames[1].cumulativeScore).toBe(20);
    expect(game.score()).toBe(20);
  });
});
