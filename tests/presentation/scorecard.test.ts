import { describe, expect, it } from "vitest";
import { Game } from "../../src/domain/game.js";
import { formatScorecard } from "../../src/presentation/scorecard.js";

describe("formatScorecard", () => {
  it("renders an empty scorecard with Spanish header at the start of a game", () => {
    const game = new Game();
    const rendered = formatScorecard(game);

    expect(rendered).toContain("MARCO");
    expect(rendered).toContain("1");
    expect(rendered).toContain("10");
    // Verify 10 frame structure with Spanish header
    const lines = rendered.trim().split("\n");
    expect(lines.length).toBe(9);
    expect(lines[0]).toBe(
      "+--------------------------------------------------------------+",
    );
    expect(lines[1]).toBe(
      "|                            MARCO                             |",
    );
    expect(lines[2]).toBe(
      "+-----+-----+-----+-----+-----+-----+-----+-----+-----+--------+",
    );
    expect(lines[3]).toBe(
      "|  1  |  2  |  3  |  4  |  5  |  6  |  7  |  8  |  9  |   10   |",
    );
    expect(lines[4]).toBe(
      "+-----+-----+-----+-----+-----+-----+-----+-----+-----+--------+",
    );
    expect(lines[5]).toBe(
      "|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |",
    );
    expect(lines[6]).toBe(
      "+-----+-----+-----+-----+-----+-----+-----+-----+-----+--------+",
    );
    expect(lines[7]).toBe(
      "|     |     |     |     |     |     |     |     |     |        |",
    );
    expect(lines[8]).toBe(
      "+-----+-----+-----+-----+-----+-----+-----+-----+-----+--------+",
    );
  });

  it("renders rolls and cumulative scores for in-progress open frames", () => {
    const game = new Game();
    game.roll(3);
    game.roll(4);
    game.roll(2);

    const rendered = formatScorecard(game);
    const lines = rendered.trim().split("\n");

    // Frame 1 has 3| 4, Frame 2 has 2|  , others empty
    expect(lines[5]).toBe(
      "| 3| 4| 2|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |",
    );
    // Frame 1 has cumulative score 7, others empty
    expect(lines[7]).toBe(
      "|  7  |     |     |     |     |     |     |     |     |        |",
    );
  });

  it("renders complete scorecard for a 20-roll game of ones", () => {
    const game = new Game();
    for (let i = 0; i < 20; i++) {
      game.roll(1);
    }

    const rendered = formatScorecard(game);
    const lines = rendered.trim().split("\n");

    expect(lines[5]).toBe(
      "| 1| 1| 1| 1| 1| 1| 1| 1| 1| 1| 1| 1| 1| 1| 1| 1| 1| 1| 1| 1|  |",
    );
    expect(lines[7]).toBe(
      "|  2  |  4  |  6  |  8  | 10  | 12  | 14  | 16  | 18  |   20   |",
    );
  });
});
