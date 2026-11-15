import { PINS } from "@bowling/domain";
import { describe, expect, it } from "vitest";
import { rack } from "../src/knock.js";
import { FOUL_LINE, LANE_WIDTH, PIN_HEIGHT } from "../src/lane-geometry.js";
import {
  type LaneCamera,
  REST_CAMERA,
  toLanePoint,
  toScreenPoint,
} from "../src/lane-projection.js";

const camera: LaneCamera = { x: 0, y: -0.6, height: 1.2, tilt: 40, fov: 56 };
const viewport = { left: 0, top: 100, width: 358, height: 560 };

describe("projecting a screen point onto the Lane", () => {
  it("lands the screen's centre where the camera looks", () => {
    const spot = toLanePoint({ x: 179, y: 380 }, viewport, camera);

    expect(spot?.x).toBeCloseTo(0);
    expect(spot?.y).toBeCloseTo(0.8301, 3);
  });

  it("lands the bottom edge nearer, where the lower edge of the view meets the Lane", () => {
    const spot = toLanePoint({ x: 179, y: 660 }, viewport, camera);

    expect(spot?.y).toBeCloseTo(-0.1152, 3);
  });

  it("lands a point to the right of centre to the right of the Lane's middle", () => {
    const spot = toLanePoint({ x: 358, y: 380 }, viewport, camera);

    expect(spot?.x).toBeCloseTo(0.6346, 3);
    expect(spot?.y).toBeCloseTo(0.8301, 3);
  });

  it("follows the camera along and across the Lane", () => {
    const moved = { ...camera, x: 0.1, y: 0.4 };
    const spot = toLanePoint({ x: 179, y: 380 }, viewport, moved);

    expect(spot?.x).toBeCloseTo(0.1);
    expect(spot?.y).toBeCloseTo(1.8301, 3);
  });

  it("misses the Lane above the horizon", () => {
    const level = { ...camera, tilt: 10 };

    expect(toLanePoint({ x: 179, y: 100 }, viewport, level)).toBeUndefined();
  });
});

describe("the camera at rest", () => {
  const phone = { left: 0, top: 0, width: 390, height: 844 };
  const small = { left: 0, top: 0, width: 320, height: 568 };

  it("draws each Pin at least 36 px tall on the design's phone", () => {
    for (const spot of rack(PINS).values()) {
      const base = toScreenPoint({ ...spot, z: 0 }, phone, REST_CAMERA);
      const top = toScreenPoint({ ...spot, z: PIN_HEIGHT }, phone, REST_CAMERA);

      expect(base.y - top.y).toBeGreaterThanOrEqual(36);
      expect(top.y).toBeGreaterThan(0);
    }
  });

  it("shows the whole approach, foul line included, inside the screen", () => {
    for (const x of [-LANE_WIDTH / 2, LANE_WIDTH / 2]) {
      for (const y of [0, FOUL_LINE]) {
        const point = toScreenPoint({ x, y, z: 0 }, small, REST_CAMERA);

        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(small.width);
        expect(point.y).toBeLessThanOrEqual(small.height);
      }
    }
  });

  it("lands a point back where it was drawn", () => {
    const spot = { x: 0.2, y: 0.4 };
    const drawn = toScreenPoint({ ...spot, z: 0 }, viewport, REST_CAMERA);
    const back = toLanePoint(drawn, viewport, REST_CAMERA);

    expect(back?.x).toBeCloseTo(spot.x);
    expect(back?.y).toBeCloseTo(spot.y);
  });
});
