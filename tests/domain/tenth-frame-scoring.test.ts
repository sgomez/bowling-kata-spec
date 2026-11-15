import { describe, expect, it } from "vitest";
import { Game } from "../../src/domain/game.js";

describe("Game Tenth Frame scoring", () => {
  it("calculates a perfect game of 12 consecutive strikes to 300 points", () => {
    const game = new Game();
    for (let i = 0; i < 12; i++) {
      game.roll(10);
    }

    expect(game.isComplete()).toBe(true);
    expect(game.frames[9].rolls).toEqual([10, 10, 10]);
    expect(game.cumulativeScores()).toEqual([
      30, 60, 90, 120, 150, 180, 210, 240, 270, 300,
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
      20, 40, 60, 80, 100, 120, 140, 160, 180, 200,
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
});
