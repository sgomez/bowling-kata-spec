import { PINS, type Pin } from "@bowling/domain";
import { describe, expect, it } from "vitest";
import type { Pose } from "../src/knock.js";
import type { LaneRoll } from "../src/lane-physics.js";
import { advance, playRoll } from "../src/lane-play.js";
import { shifted, spotOf, still, straight } from "./choreography-setup.js";

// A Roll that knocks the head Pin and settles on its first step.
const knockingHeadPin = (): LaneRoll => {
  let settled = false;
  const pins = new Map([...still(), shifted(1, 0.1)]);
  return {
    step() {
      settled = true;
    },
    get settled() {
      return settled;
    },
    ball: (): Pose => ({ ...spotOf(1), angle: 0 }),
    pins: () => pins,
    knocked: (): Pin[] => [1],
  };
};

describe("playing a Roll on the Lane", () => {
  it("sends the Roll the moment the Lane settles, while its Pins still fall", () => {
    const play = playRoll(PINS, straight);

    const first = advance(play, 16, knockingHeadPin());

    expect(first.knocked).toEqual([1]);
    expect(first.staging.pins.get(1)?.state).toBe("falling");
    expect(first.staging.done).toBe(false);
  });

  it("sends nothing while the ball rolls, then plays on after the Roll", () => {
    const play = playRoll(PINS, straight);
    const rolling = { ...knockingHeadPin(), settled: false, step() {} };

    expect(advance(play, 16, rolling).knocked).toBeUndefined();
    advance(play, 16, knockingHeadPin());
    const after = advance(play, 2600, undefined);

    expect(after.knocked).toBeUndefined();
    expect(after.staging.pins.get(1)?.state).toBe("removed");
    expect(after.staging.done).toBe(true);
  });
});
