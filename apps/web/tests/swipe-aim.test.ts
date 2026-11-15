import { describe, expect, it } from "vitest";
import { FOUL_LINE, HEAD_PIN, LANE_WIDTH } from "../src/lane-geometry.js";
import { aimOf } from "../src/swipe-aim.js";

const straight = { release: 0, direction: 0, speed: 2, spin: 0 };

describe("the aim line", () => {
  it("leaves from where the ball is released, on the foul line", () => {
    const [start] = aimOf({ ...straight, release: 0.2 });

    expect(start).toEqual({ x: 0.2, y: FOUL_LINE });
  });

  it("runs straight to the Pins when there is no spin", () => {
    const aim = aimOf(straight);

    expect(aim.every(({ x }) => x === 0)).toBe(true);
    expect(aim.at(-1)?.y).toBeCloseTo(HEAD_PIN);
  });

  it("follows the heading of the Swipe", () => {
    const end = aimOf({ ...straight, direction: 0.1 }).at(-1);

    expect(end?.x).toBeCloseTo(Math.tan(0.1) * (HEAD_PIN - FOUL_LINE));
  });

  it("curves the way the spin hooks the ball", () => {
    // Hook 0.105 × spin 0.4 at 2 m/s bends the path on a 48 m radius.
    const right = aimOf({ ...straight, spin: 0.4 }).at(-1);
    const left = aimOf({ ...straight, spin: -0.4 }).at(-1);

    expect(right?.x).toBeCloseTo(0.19, 2);
    expect(left?.x).toBeCloseTo(-0.19, 2);
  });

  it("curves less the faster the ball goes", () => {
    const fast = aimOf({ ...straight, speed: 4, spin: 0.4 }).at(-1);

    expect(fast?.x).toBeCloseTo(0.092, 2);
  });

  it("stops at the gutter", () => {
    const aim = aimOf({ ...straight, release: 0.4, direction: 0.35 });
    const end = aim.at(-1);

    expect(end?.x).toBeCloseTo(LANE_WIDTH / 2);
    expect(end?.y).toBeLessThan(HEAD_PIN);
  });
});
