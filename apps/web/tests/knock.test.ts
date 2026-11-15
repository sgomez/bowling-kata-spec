import { PINS, type Pin } from "@bowling/domain";
import { describe, expect, it } from "vitest";
import {
  hasSettled,
  knockedPins,
  type Pose,
  rack,
  type Spot,
} from "../src/knock.js";
import { FOUL_LINE, LANE_LENGTH, LANE_WIDTH } from "../src/lane-geometry.js";

describe("racking the standing Pins", () => {
  it("puts the head Pin centred and nearest the Bowler, 7 to 10 left to right at the back", () => {
    const spots = rack(PINS);
    const at = (pin: Pin) => spots.get(pin) as Spot;

    expect(at(1).x).toBeCloseTo(0);
    for (const pin of PINS) {
      expect(at(pin).y).toBeGreaterThanOrEqual(at(1).y);
      expect(at(pin).y).toBeLessThan(LANE_LENGTH);
      expect(at(pin).y).toBeGreaterThan(FOUL_LINE);
      expect(Math.abs(at(pin).x)).toBeLessThan(LANE_WIDTH / 2);
    }
    expect(at(7).x).toBeLessThan(at(8).x);
    expect(at(10).x).toBeGreaterThan(at(9).x);
    expect(at(7).y).toBeCloseTo(at(10).y);
  });

  it("racks only the standing Pins", () => {
    expect([...rack([3, 6, 10]).keys()]).toEqual([3, 6, 10]);
  });
});

describe("telling which Pins were knocked", () => {
  const spots = rack([1, 2, 3]);
  const still = (pin: Pin): Pose => ({ ...(spots.get(pin) as Spot), angle: 0 });

  it("counts nothing when every Pin stays put", () => {
    const after = new Map(([1, 2, 3] as const).map((p) => [p, still(p)]));

    expect(knockedPins(spots, after)).toEqual([]);
  });

  it("counts a Pin pushed off its spot or tilted, but not a nudge", () => {
    const one = still(1);
    const after = new Map<Pin, Pose>([
      [1, { ...one, x: one.x + 0.1 }],
      [2, { ...still(2), angle: 1 }],
      [3, { ...still(3), y: still(3).y + 0.005, angle: 0.05 }],
    ]);

    expect(knockedPins(spots, after)).toEqual([1, 2]);
  });

  it("counts a Pin that is gone from the Lane", () => {
    expect(knockedPins(spots, new Map<Pin, Pose>([[1, still(1)]]))).toEqual([
      2, 3,
    ]);
  });
});

describe("waiting for the Lane to settle", () => {
  it("settles once nothing moves", () => {
    expect(hasSettled([0, 0.001], 1_000)).toBe(true);
  });

  it("waits while the ball or a Pin still moves", () => {
    expect(hasSettled([0, 0.5], 1_000)).toBe(false);
  });

  it("gives up waiting after a while", () => {
    expect(hasSettled([0.5], 60_000)).toBe(true);
  });
});
