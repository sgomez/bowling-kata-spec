import { PINS, type Pin } from "@bowling/domain";
import { describe, expect, it } from "vitest";
import {
  type Manner,
  observe,
  recordRoll,
  settle,
  stage,
} from "../src/lane-choreography.js";
import { spotOf, still, straight } from "./choreography-setup.js";

// The Roll settles 500 ms in.
const SETTLED = 500;
const rolled = (standing: readonly Pin[], knocked: readonly Pin[]) =>
  settle(
    observe(recordRoll(standing, straight), {
      elapsed: SETTLED,
      ball: { ...spotOf(1), angle: 0 },
      pins: still(),
    }),
    knocked,
  );

const strike = rolled(PINS, PINS);
const spare = rolled([7, 10], [7, 10]);

const celebrationAt = (
  record: ReturnType<typeof rolled>,
  since: number,
  manner: Manner = {},
) => stage(record, SETTLED + since, manner).celebration;

const timeline = (record: ReturnType<typeof rolled>, manner: Manner = {}) =>
  Array.from({ length: 100 }, (_, i) => celebrationAt(record, i * 20, manner));

const flashes = (record: ReturnType<typeof rolled>, manner: Manner = {}) =>
  timeline(record, manner).filter(
    (now, i, all) => (now?.lights ?? 0) > 0 && (all[i - 1]?.lights ?? 0) === 0,
  ).length;

describe("choosing the celebration", () => {
  it("plays nothing while the ball still rolls", () => {
    const rolling = observe(recordRoll(PINS, straight), {
      elapsed: SETTLED,
      ball: { ...spotOf(1), angle: 0 },
      pins: still(),
    });

    expect(stage(rolling, SETTLED).celebration).toBeUndefined();
  });

  it("celebrates a full rack knocked down as a Strike", () => {
    expect(celebrationAt(strike, 0)?.kind).toBe("strike");
  });

  it("celebrates the rest of the rack knocked down as a Spare", () => {
    expect(celebrationAt(spare, 0)?.kind).toBe("spare");
  });

  it("tells a Roll that knocked nothing from one that knocked some", () => {
    expect(celebrationAt(rolled(PINS, []), 0)?.kind).toBe("zero");
    expect(celebrationAt(rolled(PINS, [1, 2, 3]), 0)?.kind).toBe("count");
    expect(celebrationAt(rolled([7, 10], [7]), 0)?.kind).toBe("count");
  });
});

describe("a Strike", () => {
  it("flashes the lights three times within the first 600 ms", () => {
    expect(flashes(strike)).toBe(3);
    expect(celebrationAt(strike, 0)?.lights).toBe(1);
    expect(celebrationAt(strike, 600)?.lights).toBe(0);
  });

  it("throws beams and confetti for 1200 ms", () => {
    expect(celebrationAt(strike, 1199)).toMatchObject({
      beams: true,
      confetti: true,
    });
    expect(celebrationAt(strike, 1200)).toMatchObject({
      beams: false,
      confetti: false,
    });
  });

  it("lasts 1.6 s in all", () => {
    expect(celebrationAt(strike, 1599)?.over).toBe(false);
    expect(celebrationAt(strike, 1600)?.over).toBe(true);
  });
});

describe("a Spare", () => {
  it("flashes once, with no beams or confetti, and lasts 1.1 s", () => {
    expect(flashes(spare)).toBe(1);
    expect(timeline(spare).some((c) => c?.beams || c?.confetti)).toBe(false);
    expect(celebrationAt(spare, 1099)?.over).toBe(false);
    expect(celebrationAt(spare, 1100)?.over).toBe(true);
  });
});

describe("a Roll that knocked nothing", () => {
  it("only fades in over 200 ms, with no lights", () => {
    const zero = rolled(PINS, []);

    expect(flashes(zero)).toBe(0);
    expect(celebrationAt(zero, 199)?.over).toBe(false);
    expect(celebrationAt(zero, 200)?.over).toBe(true);
  });
});

describe("celebrating with reduced motion", () => {
  const calm = { reducedMotion: true };

  it("keeps the Strike, without flashes, beams or confetti", () => {
    expect(celebrationAt(strike, 0, calm)?.kind).toBe("strike");
    expect(flashes(strike, calm)).toBe(0);
    expect(flashes(spare, calm)).toBe(0);
    expect(timeline(strike, calm).some((c) => c?.beams || c?.confetti)).toBe(
      false,
    );
  });
});
