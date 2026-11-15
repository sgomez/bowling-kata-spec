import { describe, expect, it } from "vitest";
import { Game } from "../../src/domain/game.js";
import { formatScorecard } from "../../src/presentation/scorecard.js";

describe("formatScorecard Tenth Frame", () => {
  it("renders three strikes in tenth frame as ' X| X| X' and 300 score for a perfect game", () => {
    const game = new Game();
    for (let i = 0; i < 12; i++) {
      game.roll(10);
    }

    const lines = formatScorecard(game).trim().split("\n");
    // Frames 1-9: "  | X", Frame 10: " X| X| X"
    expect(lines[5]).toBe(
      "|  | X|  | X|  | X|  | X|  | X|  | X|  | X|  | X|  | X| X| X| X|",
    );
    expect(lines[7]).toBe(
      "| 30  | 60  | 90  | 120 | 150 | 180 | 210 | 240 | 270 |  300   |",
    );
  });

  it("renders strike, 9, spare in tenth frame as ' X| 9| /'", () => {
    const game = new Game();
    for (let i = 0; i < 18; i++) {
      game.roll(0);
    }
    game.roll(10);
    game.roll(9);
    game.roll(1);

    const lines = formatScorecard(game).trim().split("\n");
    expect(lines[5]).toBe(
      "| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| X| 9| /|",
    );
    expect(lines[7]).toBe(
      "|  0  |  0  |  0  |  0  |  0  |  0  |  0  |  0  |  0  |   20   |",
    );
  });

  it("renders spare then strike in tenth frame as ' 8| /| X'", () => {
    const game = new Game();
    for (let i = 0; i < 18; i++) {
      game.roll(0);
    }
    game.roll(8);
    game.roll(2);
    game.roll(10);

    const lines = formatScorecard(game).trim().split("\n");
    expect(lines[5]).toBe(
      "| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| 8| /| X|",
    );
    expect(lines[7]).toBe(
      "|  0  |  0  |  0  |  0  |  0  |  0  |  0  |  0  |  0  |   20   |",
    );
  });

  it("renders open frame in tenth frame as ' 7| 2|  '", () => {
    const game = new Game();
    for (let i = 0; i < 18; i++) {
      game.roll(0);
    }
    game.roll(7);
    game.roll(2);

    const lines = formatScorecard(game).trim().split("\n");
    expect(lines[5]).toBe(
      "| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| 7| 2|  |",
    );
    expect(lines[7]).toBe(
      "|  0  |  0  |  0  |  0  |  0  |  0  |  0  |  0  |  0  |   9    |",
    );
  });

  it("renders in-progress tenth frame with blank score and partial marks", () => {
    const game = new Game();
    for (let i = 0; i < 18; i++) {
      game.roll(0);
    }
    game.roll(10);

    let lines = formatScorecard(game).trim().split("\n");
    expect(lines[5]).toBe(
      "| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| X|  |  |",
    );
    expect(lines[7]).toBe(
      "|  0  |  0  |  0  |  0  |  0  |  0  |  0  |  0  |  0  |        |",
    );

    game.roll(9);
    lines = formatScorecard(game).trim().split("\n");
    expect(lines[5]).toBe(
      "| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| X| 9|  |",
    );
    expect(lines[7]).toBe(
      "|  0  |  0  |  0  |  0  |  0  |  0  |  0  |  0  |  0  |        |",
    );
  });
});
