import { PINS } from "@bowling/domain";
import { describe, expect, it } from "vitest";
import { settle, stage } from "../src/lane-choreography.js";
import { LANE_LENGTH, LANE_WIDTH } from "../src/lane-geometry.js";
import { hit, shifted, spotOf } from "./choreography-setup.js";

describe("choreographing the Pins", () => {
  it("keeps every Pin standing on its spot before the ball reaches them", () => {
    const pins = stage(hit(), 100).pins;

    expect([...pins.keys()]).toEqual([...PINS]);
    for (const pin of PINS) {
      expect(pins.get(pin)).toMatchObject({
        ...spotOf(pin),
        state: "standing",
        tilt: 0,
        opacity: 1,
      });
    }
  });

  describe("a knocked Pin", () => {
    const pushed = shifted(1, 0.1);
    const at = (elapsed: number) => stage(hit(pushed), elapsed).pins.get(1);

    it("tips over towards where it was pushed", () => {
      const pin = at(660);

      expect(pin?.state).toBe("falling");
      expect(pin?.direction).toBeCloseTo(Math.PI / 2);
      expect(pin?.tilt).toBeGreaterThan(0);
      expect(pin?.tilt).toBeLessThan(Math.PI / 2);
    });

    it("lies flat where the Lane left it once it has fallen", () => {
      expect(at(820)).toMatchObject({
        state: "knocked",
        tilt: Math.PI / 2,
        opacity: 1,
        x: pushed[1].x,
        y: pushed[1].y,
      });
    });

    it("rests, then fades out", () => {
      expect(at(1519)?.opacity).toBe(1);
      const fading = at(1645)?.opacity ?? 0;
      expect(fading).toBeGreaterThan(0);
      expect(fading).toBeLessThan(1);
    });

    it("is removed once faded", () => {
      expect(at(1770)).toMatchObject({ state: "removed", opacity: 0 });
    });
  });

  describe("a Pin nudged but not knocked", () => {
    const at = (elapsed: number) =>
      stage(hit(shifted(3, 0.01)), elapsed).pins.get(3);
    const wobble = [520, 580, 650, 800, 1000, 1090].map(at);

    it("wobbles up to 8° on its spot", () => {
      for (const pin of wobble) {
        expect(pin).toMatchObject({ ...spotOf(3), state: "wobbling" });
        expect(Math.abs(pin?.tilt ?? 1)).toBeLessThanOrEqual(
          (8 * Math.PI) / 180,
        );
      }
      expect(wobble.some((pin) => (pin?.tilt ?? 0) > 0.05)).toBe(true);
      expect(wobble.some((pin) => (pin?.tilt ?? 0) < -0.05)).toBe(true);
    });

    it("settles back upright after 600 ms", () => {
      expect(at(1100)).toMatchObject({ ...spotOf(3), state: "standing" });
      expect(at(1100)?.tilt).toBeCloseTo(0);
    });
  });

  describe("once the Roll's outcome is known", () => {
    const track = hit(shifted(2, 0, 0.05));

    it("keeps standing a Pin the outcome didn't count", () => {
      const pins = stage(settle(track, []), 1200).pins;

      expect(pins.get(2)).toMatchObject({ ...spotOf(2), state: "standing" });
    });

    it("topples a Pin the outcome counted, from when it settled", () => {
      const pins = (elapsed: number) =>
        stage(settle(track, [2, 9]), elapsed).pins;

      expect(pins(900).get(2)?.state).toBe("knocked");
      expect(pins(619).get(9)?.state).toBe("standing");
      expect(pins(700).get(9)?.state).toBe("falling");
    });
  });

  it("topples a Strike row after row, 40 ms apart", () => {
    const at = (elapsed: number) =>
      stage(hit(...PINS.map((pin) => shifted(pin, 0, 0.2))), elapsed).pins;

    expect(at(520).get(1)?.state).toBe("falling");
    expect(at(520).get(2)?.state).toBe("standing");
    expect(at(560).get(3)?.tilt).toBeCloseTo(at(520).get(1)?.tilt ?? -1);
    expect(at(939).get(10)?.state).toBe("falling");
    expect(at(940).get(10)?.state).toBe("knocked");
  });

  it("keeps a knocked Pin on the Lane though its 2D body flew off", () => {
    const pin = stage(hit(shifted(10, 2, 3)), 2000).pins.get(10);

    expect(Math.abs(pin?.x ?? 9)).toBeLessThanOrEqual(LANE_WIDTH / 2);
    expect(pin?.y).toBeLessThanOrEqual(LANE_LENGTH);
  });
});
