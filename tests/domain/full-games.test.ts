import { describe, expect, it } from "vitest";
import { Game } from "../../src/domain/game.js";

describe("Game full games", () => {
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
      20, 40, 64, 80, 86, 99, 105, 124, 133, 138,
    ]);
    expect(game.score()).toBe(138);
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
});
