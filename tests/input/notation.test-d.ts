import { expectTypeOf } from "vitest";
import type { PinCount } from "../../src/domain/frame.js";
import { Game } from "../../src/domain/game.js";
import {
  type NotationResult,
  parseNotation,
} from "../../src/input/notation.js";

expectTypeOf(parseNotation).parameters.toEqualTypeOf<
  [
    token: string,
    game: Pick<
      Game,
      "remainingPins" | "isFreshRack" | "currentFrame" | "currentRoll"
    >,
  ]
>();
expectTypeOf(parseNotation).returns.toEqualTypeOf<NotationResult>();

expectTypeOf<NotationResult>().toEqualTypeOf<
  | { valid: true; pins: PinCount }
  | {
      valid: false;
      failure:
        | { type: "INVALID_FORMAT"; input: string }
        | { type: "PINS_OUT_OF_RANGE"; pinCount: number }
        | { type: "STRIKE_ON_SECOND_ROLL" }
        | { type: "STRIKE_FEWER_PINS" }
        | { type: "SPARE_ON_FIRST_ROLL" }
        | { type: "SPARE_ON_FRESH_RACK" };
    }
>();

const result = parseNotation("X", new Game());
// @ts-expect-error pins is unreachable before narrowing
result.pins;
if (!result.valid) {
  // @ts-expect-error only INVALID_FORMAT carries the raw input
  result.failure.input;
}
