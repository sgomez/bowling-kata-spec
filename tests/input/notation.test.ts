import { describe, expect, it } from "vitest";
import type { PinCount } from "../../src/domain/frame.js";
import { Game } from "../../src/domain/game.js";
import { parseNotation } from "../../src/input/notation.js";

function gameAfter(...pins: PinCount[]): Game {
  const game = new Game();
  for (const p of pins) {
    game.roll(p);
  }
  return game;
}

const NINE_GUTTER_FRAMES: PinCount[] = Array(18).fill(0);

function tenthFrameAfter(...pins: PinCount[]): Game {
  return gameAfter(...NINE_GUTTER_FRAMES, ...pins);
}

const fail = (type: string) => ({ valid: false, failure: { type } });

describe("Notation parser", () => {
  it("reads digits as a pin count", () => {
    expect(parseNotation("7", new Game())).toEqual({ valid: true, pins: 7 });
    expect(parseNotation("10", new Game())).toEqual({ valid: true, pins: 10 });
  });

  it("ignores surrounding whitespace", () => {
    expect(parseNotation(" 4 ", new Game())).toEqual({ valid: true, pins: 4 });
  });

  it("reads '-' as zero pins", () => {
    expect(parseNotation("-", new Game())).toEqual({ valid: true, pins: 0 });
  });

  it("reads 'X' and 'x' as a strike on a fresh rack", () => {
    expect(parseNotation("X", new Game())).toEqual({ valid: true, pins: 10 });
    expect(parseNotation("x", new Game())).toEqual({ valid: true, pins: 10 });
  });

  it("reads '/' as the pins still standing", () => {
    expect(parseNotation("/", gameAfter(4))).toEqual({ valid: true, pins: 6 });
    expect(parseNotation("/", gameAfter(0))).toEqual({ valid: true, pins: 10 });
  });

  it("reads '/' in the Tenth Frame after a strike and a partial roll", () => {
    expect(parseNotation("/", tenthFrameAfter(10, 0))).toEqual({
      valid: true,
      pins: 10,
    });
    expect(parseNotation("/", tenthFrameAfter(10, 9))).toEqual({
      valid: true,
      pins: 1,
    });
  });

  it("reads 'X' on Tenth Frame bonus rolls once the rack is reset", () => {
    expect(parseNotation("X", tenthFrameAfter(10))).toEqual({
      valid: true,
      pins: 10,
    });
    expect(parseNotation("X", tenthFrameAfter(8, 2))).toEqual({
      valid: true,
      pins: 10,
    });
  });

  it("rejects malformed tokens as an invalid format", () => {
    for (const token of ["abc", "4abc", "", " ", "-1", "3.5"]) {
      expect(parseNotation(token, new Game())).toEqual({
        valid: false,
        failure: { type: "INVALID_FORMAT", input: token },
      });
    }
  });

  it("rejects digits above ten as pins out of range", () => {
    expect(parseNotation("12", new Game())).toEqual({
      valid: false,
      failure: { type: "PINS_OUT_OF_RANGE", pinCount: 12 },
    });
  });

  it("rejects 'X' on the second roll of frames 1-9", () => {
    expect(parseNotation("X", gameAfter(0))).toEqual(
      fail("STRIKE_ON_SECOND_ROLL"),
    );
    expect(parseNotation("x", gameAfter(3))).toEqual(
      fail("STRIKE_ON_SECOND_ROLL"),
    );
  });

  it("rejects 'X' on the Tenth Frame's second roll after a gutter", () => {
    expect(parseNotation("X", tenthFrameAfter(0))).toEqual(
      fail("STRIKE_ON_SECOND_ROLL"),
    );
  });

  it("rejects 'X' in the Tenth Frame with fewer than ten pins standing", () => {
    expect(parseNotation("X", tenthFrameAfter(7))).toEqual(
      fail("STRIKE_FEWER_PINS"),
    );
    expect(parseNotation("X", tenthFrameAfter(10, 8))).toEqual(
      fail("STRIKE_FEWER_PINS"),
    );
  });

  it("rejects '/' on the first roll", () => {
    expect(parseNotation("/", new Game())).toEqual(fail("SPARE_ON_FIRST_ROLL"));
  });

  it("rejects '/' in the Tenth Frame when the rack has been reset", () => {
    expect(parseNotation("/", tenthFrameAfter(10))).toEqual(
      fail("SPARE_ON_FRESH_RACK"),
    );
    expect(parseNotation("/", tenthFrameAfter(10, 10))).toEqual(
      fail("SPARE_ON_FRESH_RACK"),
    );
  });
});
