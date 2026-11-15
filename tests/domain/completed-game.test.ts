import { describe, expect, it } from "vitest";
import { Game } from "../../src/domain/game.js";

function perfectGame(): Game {
  const game = new Game();
  for (let i = 0; i < 12; i++) {
    game.roll(10);
  }
  return game;
}

describe("A completed Game", () => {
  it("has no pins standing and no fresh rack", () => {
    const game = perfectGame();

    expect(game.isComplete()).toBe(true);
    expect(game.remainingPins).toBe(0);
    expect(game.isFreshRack).toBe(false);
  });

  it("stays on the Tenth Frame", () => {
    const game = perfectGame();

    expect(game.currentFrame).toBe(10);
    expect(game.currentRoll).toBe(2);
  });
});
