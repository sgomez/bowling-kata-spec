import { describe, expect, it } from "vitest";
import type { PinCount } from "../src/frame.js";
import { Game } from "../src/game.js";

const gameAfter = (rolls: PinCount[]): Game => {
  const game = new Game();
  for (const pins of rolls) {
    game.roll(pins);
  }
  return game;
};

const ninthFrameDone: PinCount[] = Array(18).fill(0);

describe("fresh rack", () => {
  it("starts every regular Frame with a fresh rack", () => {
    expect(gameAfter([]).isFreshRack).toBe(true);
    expect(gameAfter([3, 4]).isFreshRack).toBe(true);
  });

  it("is not fresh on the second Roll of a regular Frame", () => {
    expect(gameAfter([0]).isFreshRack).toBe(false);
  });

  it("starts the Tenth Frame with a fresh rack", () => {
    expect(gameAfter(ninthFrameDone).isFreshRack).toBe(true);
  });

  it("resets the rack after a Strike in the Tenth Frame", () => {
    expect(gameAfter([...ninthFrameDone, 10]).isFreshRack).toBe(true);
    expect(gameAfter([...ninthFrameDone, 10, 10]).isFreshRack).toBe(true);
  });

  it("keeps the rack after a non-Strike first Roll in the Tenth Frame", () => {
    expect(gameAfter([...ninthFrameDone, 7]).isFreshRack).toBe(false);
  });

  it("keeps the rack for the Bonus Roll after a Strike and a non-Strike", () => {
    expect(gameAfter([...ninthFrameDone, 10, 4]).isFreshRack).toBe(false);
  });

  it("resets the rack for the Bonus Roll after a Spare in the Tenth Frame", () => {
    expect(gameAfter([...ninthFrameDone, 6, 4]).isFreshRack).toBe(true);
  });
});
