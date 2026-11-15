import { describe, expect, it } from "vitest";
import { reconnectDelay } from "../src/backoff.js";

const lowest = () => 0;
const highest = () => 0.999_999;

describe("reconnect delay", () => {
  it("waits up to half a second on the first retry", () => {
    expect(reconnectDelay(0, lowest)).toBe(250);
    expect(reconnectDelay(0, highest)).toBeCloseTo(500, 0);
  });

  it("doubles its ceiling on each failed retry", () => {
    expect(reconnectDelay(1, highest)).toBeCloseTo(1000, 0);
    expect(reconnectDelay(3, highest)).toBeCloseTo(4000, 0);
  });

  it("never waits more than 8 seconds", () => {
    expect(reconnectDelay(4, highest)).toBeCloseTo(8000, 0);
    expect(reconnectDelay(50, highest)).toBeCloseTo(8000, 0);
    expect(reconnectDelay(50, lowest)).toBe(4000);
  });
});
