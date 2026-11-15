import { PINS, type Pin } from "@bowling/domain";
import { describe, expect, it } from "vitest";
import { FOUL_LINE } from "../src/lane-geometry.js";
import { startRoll } from "../src/lane-physics.js";
import type { Swipe } from "../src/swipe.js";

const straight: Swipe = { release: 0, direction: 0, speed: 4, spin: 0 };

const settle = (standing: readonly Pin[], swipe: Swipe) => {
  const roll = startRoll(standing, swipe);
  for (let ms = 0; ms < 20_000 && !roll.settled; ms += 16) roll.step(16);
  return roll;
};

describe("a Roll down the Lane", () => {
  it("knocks Pins down when the ball goes straight at the head Pin", () => {
    const roll = settle(PINS, straight);

    expect(roll.settled).toBe(true);
    expect(roll.knocked()).toContain(1);
  });

  it("knocks nothing once the ball falls into the gutter", () => {
    const roll = settle(PINS, { ...straight, release: 0.5, direction: 0.3 });

    expect(roll.settled).toBe(true);
    expect(roll.knocked()).toEqual([]);
  });

  it("racks only the Pins still standing", () => {
    expect([...startRoll([7, 10], straight).pins().keys()]).toEqual([7, 10]);
  });

  it("starts the ball at the foul line, where the Swipe released it", () => {
    const { x, y } = startRoll(PINS, { ...straight, release: 0.2 }).ball();

    expect(x).toBeCloseTo(0.2);
    expect(y).toBeCloseTo(FOUL_LINE);
  });

  it("bends the ball with spin", () => {
    const roll = startRoll(PINS, { ...straight, spin: 1 });
    for (let i = 0; i < 15; i++) roll.step(100);

    expect(Math.abs(roll.ball().x)).toBeGreaterThan(0.01);
  });
});
