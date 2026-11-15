import { describe, expect, it } from "vitest";
import { Game } from "../src/game.js";

describe("Game strikes", () => {
  it("advances immediately to next frame and roll 1 after rolling a strike on roll 1 of frames 1-9", () => {
    const game = new Game();
    game.roll(10);

    expect(game.currentFrame).toBe(2);
    expect(game.currentRoll).toBe(1);
    expect(game.frames[0].rolls).toEqual([10]);
    expect(game.frames[0].isComplete).toBe(true);
  });

  it("defers strike score calculation until two bonus rolls are recorded", () => {
    const game = new Game();
    game.roll(10); // Frame 1: strike

    // Frame 1 is complete, but bonus rolls not yet thrown
    expect(game.frames[0].cumulativeScore).toBeNull();
    expect(game.cumulativeScores()[0]).toBeNull();

    // First bonus roll (Frame 2, roll 1)
    game.roll(3);
    expect(game.frames[0].cumulativeScore).toBeNull();
    expect(game.frames[1].cumulativeScore).toBeNull();

    // Second bonus roll (Frame 2, roll 2)
    game.roll(4);
    // Now Frame 1 has 2 bonus rolls: 10 + 3 + 4 = 17
    expect(game.frames[0].cumulativeScore).toBe(17);
    // Frame 2 is an open frame (3 + 4 = 7), cumulative score: 17 + 7 = 24
    expect(game.frames[1].cumulativeScore).toBe(24);
    expect(game.score()).toBe(24);
  });

  it("handles consecutive strikes correctly deferring scores until two subsequent rolls are available", () => {
    const game = new Game();
    // Strike 1 (Frame 1)
    game.roll(10);
    expect(game.cumulativeScores()).toEqual(Array(10).fill(null));

    // Strike 2 (Frame 2)
    game.roll(10);
    expect(game.cumulativeScores()).toEqual(Array(10).fill(null));

    // Strike 3 (Frame 3)
    game.roll(10);
    // Frame 1 now has two subsequent rolls (10 and 10): 10 + 10 + 10 = 30
    // Frame 2 has only one subsequent roll (10): still null
    // Frame 3 has zero subsequent rolls: still null
    expect(game.cumulativeScores()).toEqual([
      30,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ]);

    // Roll 4: 9 (Frame 4, roll 1)
    game.roll(9);
    // Frame 2 now has two subsequent rolls (10 and 9): 10 + 10 + 9 = 29
    // Cumulative score: 30 + 29 = 59
    // Frame 3 has only one subsequent roll (9): still null
    expect(game.cumulativeScores()).toEqual([
      30,
      59,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ]);

    // Roll 5: 0 (Frame 4, roll 2)
    game.roll(0);
    // Frame 3 now has two subsequent rolls (9 and 0): 10 + 9 + 0 = 19
    // Cumulative score: 59 + 19 = 78
    // Frame 4 is complete open frame (9 + 0 = 9): 78 + 9 = 87
    expect(game.cumulativeScores()).toEqual([
      30,
      59,
      78,
      87,
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
    expect(game.score()).toBe(87);
  });
});
