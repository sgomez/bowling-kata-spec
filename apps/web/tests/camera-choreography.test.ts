import { PINS } from "@bowling/domain";
import { describe, expect, it } from "vitest";
import type { Spot } from "../src/knock.js";
import { rack } from "../src/knock.js";
import { observe, settle, stage, trackRoll } from "../src/lane-choreography.js";
import { FOUL_LINE, HEAD_PIN, PIN_HEIGHT } from "../src/lane-geometry.js";
import {
  type LaneCamera,
  REST_CAMERA,
  toScreenPoint,
} from "../src/lane-projection.js";
import { hit, shifted, still, straight } from "./choreography-setup.js";

const ballAt = (...path: Spot[]) =>
  path.reduce(
    (track, ball, i) =>
      observe(track, {
        elapsed: (i + 1) * 100,
        ball: { ...ball, angle: 0 },
        pins: still(),
      }),
    trackRoll(PINS, straight),
  );

const cameraAt = (y: number) => stage(ballAt({ x: 0, y }), 100).camera;

describe("choreographing the camera", () => {
  it("rests behind the foul line while the ball is on the approach", () => {
    expect(cameraAt(FOUL_LINE / 2)).toEqual(REST_CAMERA);
  });

  it("follows the ball down the Lane", () => {
    const quarter = cameraAt(FOUL_LINE + (HEAD_PIN - FOUL_LINE) / 4).y;
    const half = cameraAt((FOUL_LINE + HEAD_PIN) / 2).y;

    expect(quarter).toBeGreaterThan(REST_CAMERA.y);
    expect(half).toBeGreaterThan(quarter);
  });

  it("stops before the Pins, however far the ball goes", () => {
    const stop = cameraAt(HEAD_PIN).y;

    expect(cameraAt(HEAD_PIN + 0.5).y).toBe(stop);
    expect(stop).toBeLessThan(HEAD_PIN);
  });

  it("follows the ball as far as the foul line", () => {
    expect(cameraAt(HEAD_PIN).y).toBeCloseTo(FOUL_LINE);
  });
});

const small = { left: 0, top: 0, width: 320, height: 400 };

const showsEveryPin = (camera: LaneCamera) => {
  for (const spot of rack(PINS).values()) {
    const base = toScreenPoint({ ...spot, z: 0 }, small, camera);
    const top = toScreenPoint({ ...spot, z: PIN_HEIGHT }, small, camera);
    expect(base.y).toBeLessThan(small.height);
    expect(top.y).toBeGreaterThan(0);
    expect(base.y - top.y).toBeGreaterThanOrEqual(36);
  }
};

describe("the impact", () => {
  const track = hit(shifted(1, 0.1));
  const stop = cameraAt(HEAD_PIN);

  it("nudges the camera about 6 % closer, then pulls it back in 600 ms", () => {
    expect(stage(track, 500).camera).toEqual(stop);
    expect(stage(track, 680).camera.height).toBeCloseTo(stop.height * 0.94);
    expect(stage(track, 680).camera.y).toBeGreaterThan(stop.y);
    expect(stage(track, 1000).camera.height).toBeLessThan(stop.height);
    expect(stage(track, 1100).camera).toEqual(stop);
  });

  it("nudges without bouncing past 6 %", () => {
    for (let elapsed = 500; elapsed <= 1100; elapsed += 20) {
      expect(stage(track, elapsed).camera.height).toBeGreaterThanOrEqual(
        stop.height * 0.94 - 1e-9,
      );
    }
  });

  it("keeps every Pin in view, at least 36 px tall, through the nudge", () => {
    showsEveryPin(stop);
    showsEveryPin(stage(track, 680).camera);
  });

  it("flashes for 80 ms", () => {
    expect(stage(track, 499).flash).toBe(0);
    expect(stage(track, 500).flash).toBe(1);
    expect(stage(track, 540).flash).toBeGreaterThan(0);
    expect(stage(track, 580).flash).toBe(0);
  });

  it("returns to rest in 600 ms once the knocked Pins are gone", () => {
    const settled = settle(track, [1]);
    const back = stage(settled, 2070).camera.y;

    expect(stage(settled, 1770).camera).toEqual(stop);
    expect(back).toBeLessThan(stop.y);
    expect(back).toBeGreaterThan(REST_CAMERA.y);
    expect(stage(settled, 2370).camera).toEqual(REST_CAMERA);
  });

  it("keeps the camera still and dark with reduced motion", () => {
    for (const elapsed of [100, 500, 540, 680, 980]) {
      const staging = stage(track, elapsed, { reducedMotion: true });
      expect(staging.camera).toEqual(REST_CAMERA);
      expect(staging.flash).toBe(0);
    }
  });
});
