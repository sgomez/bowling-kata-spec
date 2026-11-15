import { describe, expect, it } from "vitest";
import { Game } from "../../src/domain/game.js";
import { formatScorecard } from "../../src/presentation/scorecard.js";

describe("formatScorecard marks", () => {
  it("renders 'X' for strike and '/' for spare with blank score boxes for pending frames", () => {
    const game = new Game();
    // Frame 1: strike
    game.roll(10);

    let lines = formatScorecard(game).trim().split("\n");
    // Frame 1 roll cell: "  | X", Frame 1 score: blank
    expect(lines[5]).toBe(
      "|  | X|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |",
    );
    expect(lines[7]).toBe(
      "|     |     |     |     |     |     |     |     |     |        |",
    );

    // Frame 2: spare (7, 3)
    game.roll(7);
    game.roll(3);

    lines = formatScorecard(game).trim().split("\n");
    // Frame 1 is "  | X", Frame 2 is " 7| /"
    expect(lines[5]).toBe(
      "|  | X| 7| /|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |",
    );
    // Frame 1 resolves to 20, Frame 2 is pending (blank)
    expect(lines[7]).toBe(
      "| 20  |     |     |     |     |     |     |     |     |        |",
    );

    // Frame 3: open frame (4, 2)
    game.roll(4);
    game.roll(2);

    lines = formatScorecard(game).trim().split("\n");
    expect(lines[5]).toBe(
      "|  | X| 7| /| 4| 2|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |",
    );
    // Frame 1: 20, Frame 2: 34, Frame 3: 40
    expect(lines[7]).toBe(
      "| 20  | 34  | 40  |     |     |     |     |     |     |        |",
    );
  });

  it("renders consecutive strikes correctly in scorecard", () => {
    const game = new Game();
    game.roll(10);
    game.roll(10);
    game.roll(10);

    const lines = formatScorecard(game).trim().split("\n");
    expect(lines[5]).toBe(
      "|  | X|  | X|  | X|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |",
    );
    expect(lines[7]).toBe(
      "| 30  |     |     |     |     |     |     |     |     |        |",
    );
  });

  it("renders '-' for zero-pin rolls in open frames and gutter games", () => {
    const game = new Game();
    game.roll(0);
    game.roll(7);
    game.roll(8);
    game.roll(0);

    const lines = formatScorecard(game).trim().split("\n");
    expect(lines[5]).toBe(
      "| -| 7| 8| -|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |",
    );
    expect(lines[7]).toBe(
      "|  7  | 15  |     |     |     |     |     |     |     |        |",
    );
  });

  it("renders '-' for a complete gutter game", () => {
    const game = new Game();
    for (let i = 0; i < 20; i++) {
      game.roll(0);
    }

    const lines = formatScorecard(game).trim().split("\n");
    expect(lines[5]).toBe(
      "| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -|  |",
    );
    expect(lines[7]).toBe(
      "|  0  |  0  |  0  |  0  |  0  |  0  |  0  |  0  |  0  |   0    |",
    );
  });
});
