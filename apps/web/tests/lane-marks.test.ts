import { describe, expect, it } from "vitest";
import { FOUL_LINE, HEAD_PIN, LANE_WIDTH } from "../src/lane-geometry.js";
import { ARROWS, GUIDE_DOTS, overBudget } from "../src/lane-marks.js";

const across = (marks: readonly { x: number }[]) =>
  marks.map((m) => m.x).sort((a, b) => a - b);

describe("the Lane's marks", () => {
  it("draws seven arrows in a V pointing at the Pins", () => {
    expect(ARROWS).toHaveLength(7);
    const centre = ARROWS.find((a) => a.x === 0);
    for (const arrow of ARROWS) {
      expect(arrow.y).toBeGreaterThan(FOUL_LINE);
      expect(arrow.y).toBeLessThan(HEAD_PIN);
      if (arrow !== centre) expect(arrow.y).toBeLessThan(centre?.y ?? 0);
    }
  });

  it("spaces the arrows evenly and symmetrically", () => {
    const xs = across(ARROWS);
    xs.forEach((x, i) => {
      expect(x).toBeCloseTo(-(xs.at(-1 - i) as number));
    });
    const gaps = xs.slice(1).map((x, i) => x - (xs[i] as number));
    for (const gap of gaps) expect(gap).toBeCloseTo(gaps[0] as number);
  });

  it("puts guide dots on the approach and just past the foul line", () => {
    const approach = GUIDE_DOTS.filter((d) => d.y < FOUL_LINE);
    const lane = GUIDE_DOTS.filter((d) => d.y > FOUL_LINE);
    expect(approach).toHaveLength(7);
    expect(lane).toHaveLength(8);
    expect(lane.some((d) => d.x === 0)).toBe(false);
    const nearestArrow = Math.min(...ARROWS.map((a) => a.y));
    for (const dot of lane) expect(dot.y).toBeLessThan(nearestArrow);
  });

  it("keeps every mark on the Lane", () => {
    for (const mark of [...ARROWS, ...GUIDE_DOTS]) {
      expect(Math.abs(mark.x)).toBeLessThan(LANE_WIDTH / 2);
      expect(mark.y).toBeGreaterThan(0);
    }
  });
});

describe("the scene's budget", () => {
  it("accepts a frame under 12,000 triangles and 40 draw calls", () => {
    expect(overBudget({ triangles: 11_999, calls: 39 })).toBe(false);
  });

  it.each([
    { triangles: 12_000, calls: 10 },
    { triangles: 100, calls: 40 },
  ])("flags a frame of $triangles triangles and $calls calls", (frame) => {
    expect(overBudget(frame)).toBe(true);
  });
});
