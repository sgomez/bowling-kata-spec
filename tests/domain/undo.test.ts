import { describe, expect, it } from "vitest";
import { Game } from "../../src/domain/game.js";

describe("Game undo", () => {
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
    game.roll(3); // Frame 1: spare

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
});
