import type { PinCount } from "../domain/frame.js";
import type { Game } from "../domain/game.js";

export type NotationFailure =
  | { type: "INVALID_FORMAT"; input: string }
  | { type: "PINS_OUT_OF_RANGE"; pinCount: number }
  | { type: "STRIKE_ON_SECOND_ROLL" }
  | { type: "STRIKE_FEWER_PINS" }
  | { type: "SPARE_ON_FIRST_ROLL" }
  | { type: "SPARE_ON_FRESH_RACK" };

export type NotationResult =
  | { valid: true; pins: PinCount }
  | { valid: false; failure: NotationFailure };

type GameState = Pick<
  Game,
  "remainingPins" | "isFreshRack" | "currentFrame" | "currentRoll"
>;

const ok = (pins: PinCount): NotationResult => ({ valid: true, pins });
const fail = (failure: NotationFailure): NotationResult => ({
  valid: false,
  failure,
});

function parseStrike(game: GameState): NotationResult {
  if (game.isFreshRack) {
    return ok(10);
  }
  if (game.currentFrame === 10 && game.remainingPins !== 10) {
    return fail({ type: "STRIKE_FEWER_PINS" });
  }
  return fail({ type: "STRIKE_ON_SECOND_ROLL" });
}

function parseSpare(game: GameState): NotationResult {
  if (!game.isFreshRack) {
    return ok(game.remainingPins);
  }
  return fail({
    type:
      game.currentRoll === 1 ? "SPARE_ON_FIRST_ROLL" : "SPARE_ON_FRESH_RACK",
  });
}

export function parseNotation(input: string, game: GameState): NotationResult {
  const token = input.trim().toUpperCase();
  if (token === "X") {
    return parseStrike(game);
  }
  if (token === "/") {
    return parseSpare(game);
  }
  if (token === "-") {
    return ok(0);
  }
  if (!/^\d+$/.test(token)) {
    return fail({ type: "INVALID_FORMAT", input });
  }
  const pinCount = Number.parseInt(token, 10);
  if (pinCount > 10) {
    return fail({ type: "PINS_OUT_OF_RANGE", pinCount });
  }
  return ok(pinCount as PinCount);
}
