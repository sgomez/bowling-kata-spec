import { describe, expect, it } from "vitest";
import { Game } from "../../src/domain/game.js";
import { formatScorecard } from "../../src/presentation/scorecard.js";

describe("formatScorecard undo", () => {
  it("immediately reflects undone rolls and restored cumulative scores on the scorecard", () => {
    const game = new Game();
    game.roll(10); // Frame 1: strike
    game.roll(7); // Frame 2, roll 1
    game.roll(2); // Frame 2, roll 2

    let lines = formatScorecard(game).trim().split("\n");
    expect(lines[5]).toBe(
      "|  | X| 7| 2|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |",
    );
    expect(lines[7]).toBe(
      "| 19  | 28  |     |     |     |     |     |     |     |        |",
    );

    // Undo roll 2 of Frame 2
    game.undo();
    lines = formatScorecard(game).trim().split("\n");
    expect(lines[5]).toBe(
      "|  | X| 7|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |",
    );
    expect(lines[7]).toBe(
      "|     |     |     |     |     |     |     |     |     |        |",
    );

    // Undo roll 1 of Frame 2
    game.undo();
    lines = formatScorecard(game).trim().split("\n");
    expect(lines[5]).toBe(
      "|  | X|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |",
    );
    expect(lines[7]).toBe(
      "|     |     |     |     |     |     |     |     |     |        |",
    );

    // Undo strike in Frame 1
    game.undo();
    lines = formatScorecard(game).trim().split("\n");
    expect(lines[5]).toBe(
      "|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |",
    );
    expect(lines[7]).toBe(
      "|     |     |     |     |     |     |     |     |     |        |",
    );
  });
});
