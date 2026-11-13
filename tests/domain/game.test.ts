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

  describe("Tenth Frame Special Rules", () => {
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
      game.roll("/"); // Spare in frame 10 (4 pins)
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
      game.roll("/"); // Spare
      game.roll("X"); // Strike on bonus roll (10 pins)

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

      game.roll("X"); // Frame 10, roll 1: Strike
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

      game.roll("X");
      game.roll("X");
      game.roll("X");

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

      game.roll("X");
      game.roll(9);
      game.roll("/"); // Spare on remaining 1 pin

      expect(game.isComplete()).toBe(true);
      expect(game.frames[9].rolls).toEqual([10, 9, 1]);
      expect(game.frames[9].cumulativeScore).toBe(20);
      expect(game.score()).toBe(20);
    });

    it("calculates a perfect game of 12 consecutive strikes to 300 points", () => {
      const game = new Game();
      for (let i = 0; i < 12; i++) {
        game.roll(10);
      }

      expect(game.isComplete()).toBe(true);
      expect(game.frames[9].rolls).toEqual([10, 10, 10]);
      expect(game.cumulativeScores()).toEqual([
        30,
        60,
        90,
        120,
        150,
        180,
        210,
        240,
        270,
        300,
      ]);
      expect(game.score()).toBe(300);
    });

    it("calculates Dutch 200 (alternating strikes and spares) to exactly 200 points", () => {
      const game = new Game();
      // Frame 1: Strike
      game.roll(10);
      // Frame 2: Spare
      game.roll(9);
      game.roll(1);
      // Frame 3: Strike
      game.roll(10);
      // Frame 4: Spare
      game.roll(9);
      game.roll(1);
      // Frame 5: Strike
      game.roll(10);
      // Frame 6: Spare
      game.roll(9);
      game.roll(1);
      // Frame 7: Strike
      game.roll(10);
      // Frame 8: Spare
      game.roll(9);
      game.roll(1);
      // Frame 9: Strike
      game.roll(10);
      // Frame 10: Spare + Strike bonus
      game.roll(9);
      game.roll(1);
      game.roll(10);

      expect(game.isComplete()).toBe(true);
      expect(game.cumulativeScores()).toEqual([
        20,
        40,
        60,
        80,
        100,
        120,
        140,
        160,
        180,
        200,
      ]);
      expect(game.score()).toBe(200);
    });

    it("resolves deferred bonuses of frames 8 and 9 through tenth frame rolls", () => {
      const game = new Game();
      // Frames 1-7: gutters
      for (let i = 0; i < 14; i++) {
        game.roll(0);
      }
      // Frame 8: Strike
      game.roll(10);
      // Frame 9: Strike
      game.roll(10);

      expect(game.cumulativeScores()[7]).toBeNull();
      expect(game.cumulativeScores()[8]).toBeNull();

      // Frame 10, Roll 1: Strike
      game.roll(10);
      // Frame 8 resolves: 0 + 10 + 10 + 10 = 30
      expect(game.cumulativeScores()[7]).toBe(30);
      // Frame 9 needs 1 more roll
      expect(game.cumulativeScores()[8]).toBeNull();

      // Frame 10, Roll 2: 7
      game.roll(7);
      // Frame 9 resolves: 30 + (10 + 10 + 7) = 57
      expect(game.cumulativeScores()[8]).toBe(57);
      // Frame 10 needs roll 3
      expect(game.cumulativeScores()[9]).toBeNull();

      // Frame 10, Roll 3: 2
      game.roll(2);
      // Frame 10 resolves: 57 + (10 + 7 + 2) = 76
      expect(game.cumulativeScores()[9]).toBe(76);
      expect(game.score()).toBe(76);
    });

    it("validates physical constraints and shorthand rules in the tenth frame", () => {
      const game1 = new Game();
      for (let i = 0; i < 18; i++) {
        game1.roll(0);
      }
      // Roll 1 is 7 -> cannot roll strike on roll 2
      game1.roll(7);
      expect(() => game1.roll("X")).toThrow();

      const game2 = new Game();
      for (let i = 0; i < 18; i++) {
        game2.roll(0);
      }
      // Roll 1 is Strike -> cannot roll spare on roll 2 because rack was reset
      game2.roll("X");
      expect(() => game2.roll("/")).toThrow();

      // Roll 2 is Strike -> cannot roll spare on roll 3
      game2.roll("X");
      expect(() => game2.roll("/")).toThrow();

      const game3 = new Game();
      for (let i = 0; i < 18; i++) {
        game3.roll(0);
      }
      // Roll 1 is Strike, roll 2 is 8 -> roll 3 cannot be Strike (only 2 pins left)
      game3.roll("X");
      game3.roll(8);
      expect(() => game3.roll("X")).toThrow();
    });
  });

  describe("Validation and Shorthand Notation", () => {
    it("accepts '-' as 0 pins knocked down", () => {
      const game = new Game();
      game.roll("-");

      expect(game.frames[0].rolls).toEqual([0]);
      expect(game.currentRoll).toBe(2);
      expect(game.remainingPins).toBe(10);

      game.roll(7);
      expect(game.frames[0].rolls).toEqual([0, 7]);
      expect(game.currentFrame).toBe(2);
      expect(game.score()).toBe(7);
    });

    it("rejects negative numbers and negative number strings", () => {
      const game = new Game();
      expect(() => game.roll(-1)).toThrow();
      expect(() => game.roll("-1")).toThrow();
    });

    it("rejects numbers greater than 10", () => {
      const game = new Game();
      expect(() => game.roll(11)).toThrow();
      expect(() => game.roll("12")).toThrow();
    });

    it("rejects invalid characters and malformed strings", () => {
      const game = new Game();
      expect(() => game.roll("abc")).toThrow();
      expect(() => game.roll("4abc")).toThrow();
      expect(() => game.roll("")).toThrow();
      expect(() => game.roll(" ")).toThrow();
    });

    it("rejects pin count exceeding remaining pins in frames 1-9", () => {
      const game = new Game();
      game.roll(6);
      expect(game.remainingPins).toBe(4);
      expect(() => game.roll(5)).toThrow();
      expect(() => game.roll("7")).toThrow();

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
      expect(() => game.roll(11)).toThrow();
    });
  });

  describe("Undo Functionality", () => {
    it("handles empty history gracefully (canUndo returns false, undo returns false)", () => {
      const game = new Game();
      expect(game.canUndo()).toBe(false);
      expect(game.undo()).toBe(false);
      expect(game.currentFrame).toBe(1);
      expect(game.currentRoll).toBe(1);
    });

    it("undoes the second roll of an open frame and restores remaining pins and frame state", () => {
      const game = new Game();
      game.roll(4);
      game.roll(3);

      // Frame 1 complete, now on Frame 2, Roll 1
      expect(game.currentFrame).toBe(2);
      expect(game.currentRoll).toBe(1);
      expect(game.score()).toBe(7);

      expect(game.canUndo()).toBe(true);
      expect(game.undo()).toBe(true);

      // Should be back to Frame 1, Roll 2
      expect(game.currentFrame).toBe(1);
      expect(game.currentRoll).toBe(2);
      expect(game.remainingPins).toBe(6);
      expect(game.frames[0].isComplete).toBe(false);
      expect(game.frames[0].rolls).toEqual([4]);
      expect(game.frames[0].cumulativeScore).toBeNull();
      expect(game.score()).toBe(0);
    });

    it("undoes the first roll of an open frame back to start of frame", () => {
      const game = new Game();
      game.roll(4);
      expect(game.currentFrame).toBe(1);
      expect(game.currentRoll).toBe(2);
      expect(game.remainingPins).toBe(6);

      expect(game.undo()).toBe(true);

      expect(game.currentFrame).toBe(1);
      expect(game.currentRoll).toBe(1);
      expect(game.remainingPins).toBe(10);
      expect(game.frames[0].rolls).toEqual([]);
      expect(game.frames[0].isComplete).toBe(false);
      expect(game.canUndo()).toBe(false);
    });

    it("undoes across frame boundaries for open frames", () => {
      const game = new Game();
      game.roll(3);
      game.roll(4);
      game.roll(5); // Frame 2, roll 1

      expect(game.currentFrame).toBe(2);
      expect(game.currentRoll).toBe(2);

      // Undo roll 1 of Frame 2 -> should revert to Frame 2, Roll 1
      expect(game.undo()).toBe(true);
      expect(game.currentFrame).toBe(2);
      expect(game.currentRoll).toBe(1);
      expect(game.remainingPins).toBe(10);

      // Undo roll 2 of Frame 1 -> should revert to Frame 1, Roll 2
      expect(game.undo()).toBe(true);
      expect(game.currentFrame).toBe(1);
      expect(game.currentRoll).toBe(2);
      expect(game.remainingPins).toBe(7);
      expect(game.frames[0].rolls).toEqual([3]);
    });

    it("undoes a strike in frames 1-9 and restores the frame state", () => {
      const game = new Game();
      game.roll(10); // Frame 1: strike

      expect(game.currentFrame).toBe(2);
      expect(game.currentRoll).toBe(1);
      expect(game.frames[0].isComplete).toBe(true);

      expect(game.undo()).toBe(true);

      expect(game.currentFrame).toBe(1);
      expect(game.currentRoll).toBe(1);
      expect(game.remainingPins).toBe(10);
      expect(game.frames[0].rolls).toEqual([]);
      expect(game.frames[0].isComplete).toBe(false);
    });

    it("undoes a spare in frames 1-9 and restores the remaining pins from roll 1", () => {
      const game = new Game();
      game.roll(7);
      game.roll("/"); // Frame 1: spare

      expect(game.currentFrame).toBe(2);
      expect(game.currentRoll).toBe(1);
      expect(game.frames[0].isComplete).toBe(true);

      expect(game.undo()).toBe(true);

      expect(game.currentFrame).toBe(1);
      expect(game.currentRoll).toBe(2);
      expect(game.remainingPins).toBe(3);
      expect(game.frames[0].rolls).toEqual([7]);
      expect(game.frames[0].isComplete).toBe(false);
    });

    it("reverts resolved deferred bonuses when subsequent bonus rolls are undone", () => {
      const game = new Game();
      game.roll(10); // Frame 1: strike
      game.roll(4);  // Frame 2, roll 1 (bonus 1)
      game.roll(3);  // Frame 2, roll 2 (bonus 2)

      // Frame 1 resolved: 10 + 4 + 3 = 17. Frame 2: 7 -> 24
      expect(game.cumulativeScores()[0]).toBe(17);
      expect(game.cumulativeScores()[1]).toBe(24);
      expect(game.score()).toBe(24);

      // Undo roll 2 of Frame 2 (bonus 2 for Frame 1)
      expect(game.undo()).toBe(true);

      // Frame 1 score is now unresolved again!
      expect(game.cumulativeScores()[0]).toBeNull();
      expect(game.cumulativeScores()[1]).toBeNull();
      expect(game.score()).toBe(0);
      expect(game.currentFrame).toBe(2);
      expect(game.currentRoll).toBe(2);
      expect(game.remainingPins).toBe(6);
    });

    it("undoes tenth frame rolls and restores isComplete to false", () => {
      const game = new Game();
      // 18 gutter rolls for frames 1-9
      for (let i = 0; i < 18; i++) {
        game.roll(0);
      }
      expect(game.currentFrame).toBe(10);
      expect(game.currentRoll).toBe(1);

      // Roll 1: Strike
      game.roll("X");
      expect(game.currentFrame).toBe(10);
      expect(game.currentRoll).toBe(2);
      expect(game.remainingPins).toBe(10);

      // Roll 2: Strike
      game.roll("X");
      expect(game.currentFrame).toBe(10);
      expect(game.currentRoll).toBe(3);
      expect(game.remainingPins).toBe(10);

      // Roll 3: Strike -> Perfect finish to 10th frame
      game.roll("X");
      expect(game.isComplete()).toBe(true);
      expect(game.score()).toBe(30);

      // Undo roll 3
      expect(game.undo()).toBe(true);
      expect(game.isComplete()).toBe(false);
      expect(game.currentFrame).toBe(10);
      expect(game.currentRoll).toBe(3);
      expect(game.remainingPins).toBe(10);
      expect(game.frames[9].isComplete).toBe(false);
      expect(game.frames[9].rolls).toEqual([10, 10]);

      // Can roll again after undoing!
      game.roll(7);
      expect(game.isComplete()).toBe(true);
      expect(game.frames[9].rolls).toEqual([10, 10, 7]);
      expect(game.score()).toBe(27);
    });

    it("supports multiple consecutive undos back to the start of the game", () => {
      const game = new Game();
      game.roll(10); // Frame 1
      game.roll(5);  // Frame 2, roll 1
      game.roll(5);  // Frame 2, roll 2 (spare)
      game.roll(3);  // Frame 3, roll 1

      expect(game.currentFrame).toBe(3);
      expect(game.currentRoll).toBe(2);

      // 4 rolls total, undo all 4
      expect(game.undo()).toBe(true); // undo Frame 3 roll 1
      expect(game.currentFrame).toBe(3);
      expect(game.currentRoll).toBe(1);

      expect(game.undo()).toBe(true); // undo Frame 2 roll 2
      expect(game.currentFrame).toBe(2);
      expect(game.currentRoll).toBe(2);
      expect(game.remainingPins).toBe(5);

      expect(game.undo()).toBe(true); // undo Frame 2 roll 1
      expect(game.currentFrame).toBe(2);
      expect(game.currentRoll).toBe(1);
      expect(game.remainingPins).toBe(10);

      expect(game.undo()).toBe(true); // undo Frame 1 roll 1
      expect(game.currentFrame).toBe(1);
      expect(game.currentRoll).toBe(1);
      expect(game.remainingPins).toBe(10);
      expect(game.canUndo()).toBe(false);
      expect(game.score()).toBe(0);

      // Next undo returns false and does nothing
      expect(game.undo()).toBe(false);
      expect(game.currentFrame).toBe(1);
      expect(game.currentRoll).toBe(1);
    });
  });
});
