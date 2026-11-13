import { describe, it, expect } from "vitest";
import { Game } from "../../src/domain/game.js";
import { formatScorecard } from "../../src/presentation/scorecard.js";

describe("formatScorecard", () => {
  it("renders an empty scorecard at the start of a game", () => {
    const game = new Game();
    const rendered = formatScorecard(game);

    expect(rendered).toContain("1");
    expect(rendered).toContain("10");
    // Verify 10 frame structure
    const lines = rendered.trim().split("\n");
    expect(lines.length).toBe(7);
    expect(lines[0]).toBe("+-----+-----+-----+-----+-----+-----+-----+-----+-----+--------+");
    expect(lines[1]).toBe("|  1  |  2  |  3  |  4  |  5  |  6  |  7  |  8  |  9  |   10   |");
    expect(lines[2]).toBe("+-----+-----+-----+-----+-----+-----+-----+-----+-----+--------+");
    expect(lines[3]).toBe("|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |");
    expect(lines[4]).toBe("+-----+-----+-----+-----+-----+-----+-----+-----+-----+--------+");
    expect(lines[5]).toBe("|     |     |     |     |     |     |     |     |     |        |");
    expect(lines[6]).toBe("+-----+-----+-----+-----+-----+-----+-----+-----+-----+--------+");
  });

  it("renders rolls and cumulative scores for in-progress open frames", () => {
    const game = new Game();
    game.roll(3);
    game.roll(4);
    game.roll(2);

    const rendered = formatScorecard(game);
    const lines = rendered.trim().split("\n");

    // Frame 1 has 3| 4, Frame 2 has 2|  , others empty
    expect(lines[3]).toBe("| 3| 4| 2|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |");
    // Frame 1 has cumulative score 7, others empty
    expect(lines[5]).toBe("|  7  |     |     |     |     |     |     |     |     |        |");
  });

  it("renders complete scorecard for a 20-roll game of ones", () => {
    const game = new Game();
    for (let i = 0; i < 20; i++) {
      game.roll(1);
    }

    const rendered = formatScorecard(game);
    const lines = rendered.trim().split("\n");

    expect(lines[3]).toBe("| 1| 1| 1| 1| 1| 1| 1| 1| 1| 1| 1| 1| 1| 1| 1| 1| 1| 1| 1| 1|  |");
    expect(lines[5]).toBe("|  2  |  4  |  6  |  8  | 10  | 12  | 14  | 16  | 18  |   20   |");
  });

  it("renders 'X' for strike and '/' for spare with blank score boxes for pending frames", () => {
    const game = new Game();
    // Frame 1: strike
    game.roll(10);

    let lines = formatScorecard(game).trim().split("\n");
    // Frame 1 roll cell: "  | X", Frame 1 score: blank
    expect(lines[3]).toBe("|  | X|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |");
    expect(lines[5]).toBe("|     |     |     |     |     |     |     |     |     |        |");

    // Frame 2: spare (7, 3)
    game.roll(7);
    game.roll(3);

    lines = formatScorecard(game).trim().split("\n");
    // Frame 1 is "  | X", Frame 2 is " 7| /"
    expect(lines[3]).toBe("|  | X| 7| /|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |");
    // Frame 1 resolves to 20, Frame 2 is pending (blank)
    expect(lines[5]).toBe("| 20  |     |     |     |     |     |     |     |     |        |");

    // Frame 3: open frame (4, 2)
    game.roll(4);
    game.roll(2);

    lines = formatScorecard(game).trim().split("\n");
    expect(lines[3]).toBe("|  | X| 7| /| 4| 2|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |");
    // Frame 1: 20, Frame 2: 34, Frame 3: 40
    expect(lines[5]).toBe("| 20  | 34  | 40  |     |     |     |     |     |     |        |");
  });

  it("renders consecutive strikes correctly in scorecard", () => {
    const game = new Game();
    game.roll(10);
    game.roll(10);
    game.roll(10);

    const lines = formatScorecard(game).trim().split("\n");
    expect(lines[3]).toBe("|  | X|  | X|  | X|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |");
    expect(lines[5]).toBe("| 30  |     |     |     |     |     |     |     |     |        |");
  });
});
