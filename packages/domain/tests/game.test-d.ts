import { expectTypeOf } from "vitest";
import type { FrameNumber, PinCount } from "../src/frame.js";
import { Game } from "../src/game.js";

const game = new Game();

// A Roll is a pin count from 0 to 10, never a string.
game.roll(0);
game.roll(10);
// @ts-expect-error a Roll rejects Notation strings
game.roll("X");
// @ts-expect-error a Roll rejects digit strings
game.roll("7");
// @ts-expect-error a Roll rejects pin counts above ten
game.roll(11);
// @ts-expect-error a Roll rejects negative pin counts
game.roll(-1);
// @ts-expect-error a Roll rejects fractional pin counts
game.validateRoll(3.5);

expectTypeOf<PinCount>().toEqualTypeOf<
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
>();
expectTypeOf<FrameNumber>().toEqualTypeOf<
  1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
>();

// A validation result must be narrowed before reading its failure or pin count.
const result = game.validateRoll(5);
// @ts-expect-error pins is unreachable before narrowing
result.pins;
// @ts-expect-error failure is unreachable before narrowing
result.failure;
if (result.valid) {
  expectTypeOf(result.pins).toEqualTypeOf<PinCount>();
} else {
  expectTypeOf(result.failure.type).toEqualTypeOf<
    "GAME_COMPLETE" | "EXCEEDS_REMAINING_PINS"
  >();
}

// Frames and their Rolls are read-only.
const frames = game.frames;
// @ts-expect-error the Frames list cannot grow
frames.push(frames[0]);
// @ts-expect-error a Frame cannot be replaced
frames[0] = frames[1];
// @ts-expect-error a Frame's Rolls cannot grow
frames[0].rolls.push(3);
// @ts-expect-error a Roll cannot be overwritten
frames[0].rolls[0] = 3;
// @ts-expect-error a Frame's score cannot be overwritten
frames[0].cumulativeScore = 0;

expectTypeOf(frames[0].frameNumber).toEqualTypeOf<FrameNumber>();
expectTypeOf(game.currentFrame).toEqualTypeOf<FrameNumber>();
expectTypeOf(game.frames[0].cumulativeScore).toEqualTypeOf<number | null>();
expectTypeOf(game.cumulativeScores()).toEqualTypeOf<(number | null)[]>();
