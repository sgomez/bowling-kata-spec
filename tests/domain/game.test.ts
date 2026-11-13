import { describe, it, expect } from "vitest";
import { Game } from "../../src/domain/game.js";

describe("Game", () => {
  it("starts at frame 1 and roll 1 with score 0", () => {
    const game = new Game();

    expect(game.currentFrame).toBe(1);
    expect(game.currentRoll).toBe(1);
    expect(game.score()).toBe(0);
    expect(game.isComplete()).toBe(false);
  });

  it("advances to roll 2 within the same frame after first roll of an open frame", () => {
    const game = new Game();
    game.roll(3);

    expect(game.currentFrame).toBe(1);
    expect(game.currentRoll).toBe(2);
  });

  it("advances to next frame and roll 1 after second roll of an open frame", () => {
    const game = new Game();
    game.roll(3);
    game.roll(4);

    expect(game.currentFrame).toBe(2);
    expect(game.currentRoll).toBe(1);
    expect(game.score()).toBe(7);
  });

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

  it("calculates correct cumulative scores for a mixed game of strikes, spares, and open frames", () => {
    const game = new Game();
    // Frame 1: Strike (10)
    game.roll(10);
    // Frame 2: Spare (7, 3)
    game.roll(7);
    game.roll(3);
    // Frame 1 resolves: 10 + 7 + 3 = 20
    expect(game.cumulativeScores()[0]).toBe(20);
    expect(game.cumulativeScores()[1]).toBeNull();

    // Frame 3: Open (9, 0)
    game.roll(9);
    // Frame 2 resolves: 20 + (10 + 9) = 39
    expect(game.cumulativeScores()[1]).toBe(39);
    game.roll(0);
    // Frame 3 resolves: 39 + 9 = 48
    expect(game.cumulativeScores()[2]).toBe(48);

    // Frame 4: Strike (10)
    game.roll(10);
    expect(game.cumulativeScores()[3]).toBeNull();

    // Frame 5: Open (0, 8)
    game.roll(0);
    game.roll(8);
    // Frame 4 resolves: 48 + (10 + 0 + 8) = 66
    expect(game.cumulativeScores()[3]).toBe(66);
    // Frame 5 resolves: 66 + 8 = 74
    expect(game.cumulativeScores()[4]).toBe(74);
    expect(game.score()).toBe(74);
  });

  it("calculates a complete 10-frame game containing strikes, spares, and open frames", () => {
    const game = new Game();
    // Frame 1: Strike
    game.roll(10);
    // Frame 2: Spare
    game.roll(7);
    game.roll(3);
    // Frame 3: Strike
    game.roll(10);
    // Frame 4: Strike
    game.roll(10);
    // Frame 5: Open
    game.roll(4);
    game.roll(2);
    // Frame 6: Spare
    game.roll(5);
    game.roll(5);
    // Frame 7: Open
    game.roll(3);
    game.roll(3);
    // Frame 8: Strike
    game.roll(10);
    // Frame 9: Open
    game.roll(8);
    game.roll(1);
    // Frame 10: Open
    game.roll(2);
    game.roll(3);

    expect(game.isComplete()).toBe(true);
    expect(game.cumulativeScores()).toEqual([
      20,
      40,
      64,
      80,
      86,
      99,
      105,
      124,
      133,
      138,
    ]);
    expect(game.score()).toBe(138);
  });

  it("supports shorthand notation 'X', 'x', and '/' for strikes and spares", () => {
    const game = new Game();
    // 'X' on roll 1 -> strike (10 pins)
    game.roll("X");
    expect(game.frames[0].rolls).toEqual([10]);
    expect(game.frames[0].isComplete).toBe(true);

    // 'x' on roll 1 -> strike (10 pins)
    game.roll("x");
    expect(game.frames[1].rolls).toEqual([10]);
    expect(game.frames[1].isComplete).toBe(true);

    // Roll 1: 4 pins, then '/' on roll 2 -> spare (6 pins)
    game.roll(4);
    game.roll("/");
    expect(game.frames[2].rolls).toEqual([4, 6]);
    expect(game.frames[2].isComplete).toBe(true);

    // Invalid '/' on roll 1
    expect(() => game.roll("/")).toThrow("Cannot roll a spare on the first roll");

    // Invalid 'X' on roll 2 of frame 4
    game.roll(3);
    expect(() => game.roll("X")).toThrow(
      "Cannot roll a strike on the second roll of frames 1-9"
    );
  });

  it("calculates score 0 for a gutter game of 20 zero rolls and marks game complete", () => {
    const game = new Game();
    for (let i = 0; i < 20; i++) {
      game.roll(0);
    }

    expect(game.score()).toBe(0);
    expect(game.isComplete()).toBe(true);
    expect(game.currentFrame).toBe(10);
  });

  it("calculates score 20 for twenty rolls of 1 pin and marks game complete", () => {
    const game = new Game();
    for (let i = 0; i < 20; i++) {
      game.roll(1);
    }

    expect(game.score()).toBe(20);
    expect(game.isComplete()).toBe(true);
    expect(game.currentFrame).toBe(10);
  });

  it("provides frame details and cumulative scores for mixed open frames", () => {
    const game = new Game();
    game.roll(3);
    game.roll(4);
    game.roll(2);
    game.roll(5);
    game.roll(4);

    const frames = game.frames;
    expect(frames).toHaveLength(10);

    // Frame 1
    expect(frames[0].frameNumber).toBe(1);
    expect(frames[0].rolls).toEqual([3, 4]);
    expect(frames[0].isComplete).toBe(true);
    expect(frames[0].cumulativeScore).toBe(7);

    // Frame 2
    expect(frames[1].frameNumber).toBe(2);
    expect(frames[1].rolls).toEqual([2, 5]);
    expect(frames[1].isComplete).toBe(true);
    expect(frames[1].cumulativeScore).toBe(14);

    // Frame 3 (in progress)
    expect(frames[2].frameNumber).toBe(3);
    expect(frames[2].rolls).toEqual([4]);
    expect(frames[2].isComplete).toBe(false);
    expect(frames[2].cumulativeScore).toBeNull();

    // Frame 4 (unplayed)
    expect(frames[3].frameNumber).toBe(4);
    expect(frames[3].rolls).toEqual([]);
    expect(frames[3].isComplete).toBe(false);
    expect(frames[3].cumulativeScore).toBeNull();

    expect(game.cumulativeScores()).toEqual([
      7,
      14,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
  });

  it("throws an error if roll is attempted after game is complete", () => {
    const game = new Game();
    for (let i = 0; i < 20; i++) {
      game.roll(0);
    }
    expect(game.isComplete()).toBe(true);
    expect(() => game.roll(1)).toThrow("Game is already complete");
  });
});
