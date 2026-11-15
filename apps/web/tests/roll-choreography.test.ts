import { PINS } from "@bowling/domain";
import { describe, expect, it } from "vitest";
import type { Spot } from "../src/knock.js";
import {
  atRest,
  observe,
  recordRoll,
  settle,
  stage,
} from "../src/lane-choreography.js";
import { BALL_RADIUS, FOUL_LINE, LANE_WIDTH } from "../src/lane-geometry.js";
import { hit, shifted, spotOf, still, straight } from "./choreography-setup.js";

describe("choreographing the ball", () => {
  const rollTo = (swipe: typeof straight, ...path: Spot[]) =>
    path.reduce(
      (record, ball, i) =>
        observe(record, {
          elapsed: (i + 1) * 100,
          ball: { ...ball, angle: 0 },
          pins: still(),
        }),
      recordRoll(PINS, swipe),
    );

  it("rolls by the distance it travelled over its radius", () => {
    const ball = stage(
      rollTo(straight, { x: 0, y: FOUL_LINE + 0.3 }, { x: 0.4, y: 1.15 }),
      200,
    ).ball;

    expect(ball).toMatchObject({ x: 0.4, y: 1.15, gutter: false });
    expect(ball.roll).toBeCloseTo(0.8 / BALL_RADIUS);
  });

  it("spins with the Swipe's spin, not without it", () => {
    const spin = (swipeSpin: number, elapsed: number) =>
      stage(rollTo({ ...straight, spin: swipeSpin }, { x: 0, y: 1 }), elapsed)
        .ball.spin;

    expect(spin(0, 1000)).toBe(0);
    expect(spin(0.5, 1000)).toBeGreaterThan(0);
    expect(spin(0.5, 2000)).toBeGreaterThan(spin(0.5, 1000));
    expect(spin(-0.5, 1000)).toBeLessThan(0);
  });

  it("drops into the gutter past the Lane's edge", () => {
    const edge = LANE_WIDTH / 2;
    const onLane = { x: edge - 0.01, y: 1 };

    expect(stage(rollTo(straight, onLane), 100).ball.gutter).toBe(false);
    expect(
      stage(rollTo(straight, onLane, { x: edge + 0.02, y: 1.2 }), 200).ball
        .gutter,
    ).toBe(true);
  });
});

describe("choreographing with reduced motion", () => {
  const calm = { reducedMotion: true };
  const record = hit(shifted(1, 0.1), shifted(3, 0.01));
  const tilts = (manner = {}) =>
    [500, 580, 660, 740, 820].map(
      (elapsed) => stage(record, elapsed, manner).pins.get(1)?.tilt ?? -1,
    );

  it("keeps a nudged Pin still instead of wobbling", () => {
    for (const elapsed of [520, 650, 800, 1000]) {
      expect(stage(record, elapsed, calm).pins.get(3)).toMatchObject({
        ...spotOf(3),
        state: "standing",
        tilt: 0,
      });
    }
  });

  it("still topples a knocked Pin, evenly, without bounce", () => {
    expect(tilts(calm).map((tilt) => tilt / (Math.PI / 2))).toEqual(
      [0, 0.25, 0.5, 0.75, 1].map((share) => expect.closeTo(share)),
    );
    expect(stage(record, 820, calm).pins.get(1)?.state).toBe("knocked");
  });

  it("lets a Pin fall slowly at first, then faster, when motion is welcome", () => {
    const welcome = tilts();
    const steps = welcome.slice(1).map((tilt, i) => tilt - (welcome[i] ?? 0));

    expect(steps).toEqual([...steps].sort((a, b) => a - b));
    expect(steps[0]).toBeLessThan((steps.at(-1) ?? 0) / 2);
    expect(Math.max(...welcome)).toBeCloseTo(Math.PI / 2);
  });
});

describe("telling when the choreography is over", () => {
  const record = hit(shifted(1, 0.1), shifted(3, 0.01));

  it("is never over while the ball still rolls", () => {
    expect(stage(record, 5000).done).toBe(false);
  });

  it("is over once the Roll settled, every Pin stands or is removed and the camera is back", () => {
    const settled = settle(record, [1]);

    expect(stage(settled, 1100).done).toBe(false);
    expect(stage(settled, 2369).done).toBe(false);
    expect(stage(settled, 2370).done).toBe(true);
  });

  it("stands the remaining Pins on their spots, ball at rest, between Rolls", () => {
    const staging = atRest([2, 7], { x: 0.1, y: 0.2 });

    expect([...staging.pins.values()]).toEqual(
      ([2, 7] as const).map((pin) =>
        expect.objectContaining({ ...spotOf(pin), state: "standing", tilt: 0 }),
      ),
    );
    expect(staging.ball).toMatchObject({ x: 0.1, y: 0.2, gutter: false });
    expect(staging.done).toBe(true);
  });
});
