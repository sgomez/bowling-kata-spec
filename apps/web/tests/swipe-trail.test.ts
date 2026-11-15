import { describe, expect, it } from "vitest";
import { trailOpacity, trailWidth } from "../src/swipe-trail.js";

const swipe = (speed: number) => ({ release: 0, direction: 0, speed, spin: 0 });

describe("the swipe trail", () => {
  it("grows with speed", () => {
    expect(trailWidth(swipe(1))).toBeLessThan(trailWidth(swipe(3)));
    expect(trailWidth(swipe(3))).toBeLessThan(trailWidth(swipe(6)));
  });

  it("is thinnest before the Swipe can be read", () => {
    expect(trailWidth(undefined)).toBe(trailWidth(swipe(0)));
  });

  it("fades out in 220 ms once released", () => {
    expect(trailOpacity(0)).toBe(1);
    expect(trailOpacity(110)).toBeGreaterThan(0);
    expect(trailOpacity(110)).toBeLessThan(0.5);
    expect(trailOpacity(220)).toBe(0);
    expect(trailOpacity(500)).toBe(0);
  });
});
