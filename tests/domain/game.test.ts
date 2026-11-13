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
