import { PINS, type Pin } from "@bowling/domain";
import { type Pose, rack, type Spot } from "../src/knock.js";
import { observe, recordRoll } from "../src/lane-choreography.js";

export const straight = { release: 0, direction: 0, speed: 3, spin: 0 };

const spots = rack(PINS);
export const spotOf = (pin: Pin) => spots.get(pin) as Spot;

export const still = (): Map<Pin, Pose> =>
  new Map(PINS.map((pin) => [pin, { ...spotOf(pin), angle: 0 }]));

export const shifted = (pin: Pin, dx: number, dy = 0): [Pin, Pose] => {
  const { x, y } = spotOf(pin);
  return [pin, { x: x + dx, y: y + dy, angle: 0 }];
};

// The ball reaches the head Pin 500 ms into the Roll, moving these Pins.
const IMPACT = 500;
export const hit = (...moved: [Pin, Pose][]) =>
  observe(recordRoll(PINS, straight), {
    elapsed: IMPACT,
    ball: { ...spotOf(1), angle: 0 },
    pins: new Map([...still(), ...moved]),
  });
