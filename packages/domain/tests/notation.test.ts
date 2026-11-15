import { describe, expect, it } from "vitest";
import type { Frame, PinCount } from "../src/frame.js";
import { notation } from "../src/notation.js";

const frame = (...rolls: PinCount[]): Frame => ({
  frameNumber: 10,
  rolls,
  isComplete: true,
  cumulativeScore: null,
});

describe("Notation of a Frame", () => {
  it.each([
    [
      [3, 4],
      ["3", "4"],
    ],
    [
      [0, 0],
      ["-", "-"],
    ],
    [[10], ["X"]],
    [
      [7, 3],
      ["7", "/"],
    ],
    [
      [0, 10],
      ["-", "/"],
    ],
    [
      [10, 10, 10],
      ["X", "X", "X"],
    ],
    [
      [7, 3, 10],
      ["7", "/", "X"],
    ],
    [
      [10, 7, 3],
      ["X", "7", "/"],
    ],
    [
      [10, 0, 5],
      ["X", "-", "5"],
    ],
  ] as [PinCount[], string[]][])("writes %j as %j", (rolls, symbols) => {
    expect(notation(frame(...rolls))).toEqual(symbols);
  });
});
