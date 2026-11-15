import { describe, expect, it } from "vitest";
import { LANE_WIDTH } from "../src/lane-geometry.js";
import { readSwipe, type Swipe, toLane } from "../src/swipe.js";

const near = (swipe: Swipe) =>
  Object.fromEntries(
    Object.entries(swipe).map(([key, value]) => [
      key,
      expect.closeTo(value, 3),
    ]),
  );

describe("reading a Swipe", () => {
  it("reads a straight Swipe up the middle as a release with no angle or spin", () => {
    const swipe = readSwipe([
      { x: 0, y: 0.1, t: 0 },
      { x: 0, y: 0.2, t: 50 },
      { x: 0, y: 0.3, t: 100 },
      { x: 0, y: 0.4, t: 150 },
    ]);

    expect(swipe).toEqual(
      near({ release: 0, direction: 0, speed: 2, spin: 0 }),
    );
  });

  it("releases where the finger lifts, heading the way it was moving", () => {
    const swipe = readSwipe([
      { x: 0.14, y: 0.1, t: 0 },
      { x: 0.17, y: 0.2, t: 50 },
      { x: 0.2, y: 0.3, t: 100 },
    ]);

    expect(swipe).toEqual(
      near({ release: 0.2, direction: Math.atan(0.3), speed: 2.088, spin: 0 }),
    );
  });

  it("takes the speed from the moment of release, not the whole Swipe", () => {
    const swipe = readSwipe([
      { x: 0, y: 0, t: 0 },
      { x: 0, y: 0.05, t: 200 },
      { x: 0, y: 0.1, t: 400 },
      { x: 0, y: 0.4, t: 500 },
    ]);

    expect(swipe?.speed).toBeCloseTo(3);
  });

  const bowed = (bow: number) =>
    readSwipe([
      { x: 0, y: 0, t: 0 },
      { x: -bow, y: 0.1, t: 50 },
      { x: 0, y: 0.2, t: 100 },
    ]);

  it("spins a Swipe that bows left to curve right, keeping its aim", () => {
    expect(bowed(0.02)?.spin).toBeGreaterThan(0);
    expect(bowed(0.02)?.direction).toBeCloseTo(0);
    expect(bowed(0.02)?.release).toBeCloseTo(0);
  });

  it("spins a Swipe that bows right to curve left", () => {
    expect(bowed(-0.02)?.spin).toBeLessThan(0);
  });

  it("spins more the more the Swipe bows, up to a full spin", () => {
    expect(bowed(0.04)?.spin).toBeGreaterThan(bowed(0.02)?.spin ?? 1);
    expect(bowed(0.5)?.spin).toBe(1);
    expect(bowed(-0.5)?.spin).toBe(-1);
  });

  it("ignores a tap, a Swipe away from the Pins and a slow drag", () => {
    expect(readSwipe([])).toBeUndefined();
    expect(readSwipe([{ x: 0, y: 0.1, t: 0 }])).toBeUndefined();
    expect(
      readSwipe([
        { x: 0, y: 0.1, t: 0 },
        { x: 0.01, y: 0.11, t: 80 },
      ]),
    ).toBeUndefined();
    expect(
      readSwipe([
        { x: 0, y: 0.4, t: 0 },
        { x: 0, y: 0.1, t: 100 },
      ]),
    ).toBeUndefined();
    expect(
      readSwipe([
        { x: 0, y: 0.1, t: 0 },
        { x: 0, y: 0.3, t: 2000 },
      ]),
    ).toBeUndefined();
  });

  const straight = (x: number, dx: number, dy: number, ms: number) =>
    readSwipe([
      { x, y: 0.1, t: 0 },
      { x: x + dx, y: 0.1 + dy, t: ms },
    ]);

  it("caps the speed", () => {
    expect(straight(0, 0, 0.3, 10)?.speed).toBe(straight(0, 0, 0.3, 5)?.speed);
  });

  it("caps how far to the side the ball can head", () => {
    expect(straight(0, 0.3, 0.05, 100)?.direction).toBe(
      straight(0, 0.3, 0.01, 100)?.direction,
    );
    expect(straight(0, -0.3, 0.05, 100)?.direction).toBeLessThan(0);
  });

  it("releases the ball inside the Lane", () => {
    const release = straight(1, 1, 0.3, 100)?.release ?? Number.NaN;

    expect(release).toBeLessThan(LANE_WIDTH / 2);
    expect(straight(-1, -1, 0.3, 100)?.release).toBe(-release);
  });
});

describe("placing a touch on the Lane", () => {
  const rect = { left: 10, top: 20, width: 210, height: 460 };

  it("maps the screen's bottom-left corner to the near left edge", () => {
    const sample = toLane({ clientX: 10, clientY: 480, timeStamp: 7 }, rect);

    expect(sample).toEqual({ x: expect.closeTo(-0.525), y: 0, t: 7 });
  });

  it("maps the top centre to the far end, behind the Pins", () => {
    const sample = toLane({ clientX: 115, clientY: 20, timeStamp: 0 }, rect);

    expect(sample).toEqual({ x: 0, y: expect.closeTo(2.3), t: 0 });
  });
});
