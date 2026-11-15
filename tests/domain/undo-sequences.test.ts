import { describe, expect, it } from "vitest";
import { Game } from "../../src/domain/game.js";

describe("Game undo sequences", () => {
  it("reverts resolved deferred bonuses when subsequent bonus rolls are undone", () => {
    const game = new Game();
    game.roll(10); // Frame 1: strike
    game.roll(4); // Frame 2, roll 1 (bonus 1)
    game.roll(3); // Frame 2, roll 2 (bonus 2)

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
    game.roll(10);
    expect(game.currentFrame).toBe(10);
    expect(game.currentRoll).toBe(2);
    expect(game.remainingPins).toBe(10);

    // Roll 2: Strike
    game.roll(10);
    expect(game.currentFrame).toBe(10);
    expect(game.currentRoll).toBe(3);
    expect(game.remainingPins).toBe(10);

    // Roll 3: Strike -> Perfect finish to 10th frame
    game.roll(10);
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
    game.roll(5); // Frame 2, roll 1
    game.roll(5); // Frame 2, roll 2 (spare)
    game.roll(3); // Frame 3, roll 1

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
