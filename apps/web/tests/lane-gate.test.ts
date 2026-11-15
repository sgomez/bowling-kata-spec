import { describe, expect, it } from "vitest";
import { canStartSwipe, checkTime, pastSwipeLimit } from "../src/lane-gate.js";
import { FOUL_LINE, LANE_WIDTH } from "../src/lane-geometry.js";

const open = { now: 1_000, endsAt: 2_000 };
const over = { now: 2_000, endsAt: 2_000 };
const behindFoulLine = { x: 0, y: FOUL_LINE - 0.1 };

describe("the Lane's time gate", () => {
  it.each(["idle", "aiming", "rolling"] as const)(
    "lets a %s Lane run while the Frame Window is open",
    (activity) => {
      expect(checkTime(activity, open)).toBe("running");
    },
  );

  it("just stops an idle Lane when time is up", () => {
    expect(checkTime("idle", over)).toBe("over");
  });

  it.each(["aiming", "rolling"] as const)(
    "loses a Roll still %s when time is up",
    (activity) => {
      expect(checkTime(activity, over)).toBe("missed");
    },
  );

  it("starts a Swipe behind the foul line while time remains", () => {
    expect(canStartSwipe("idle", open, behindFoulLine)).toBe(true);
  });

  it("refuses a Swipe once time is up", () => {
    expect(canStartSwipe("idle", over, behindFoulLine)).toBe(false);
  });

  it("refuses a Swipe while a Roll is in flight", () => {
    expect(canStartSwipe("rolling", open, behindFoulLine)).toBe(false);
  });

  it("refuses a Swipe starting past the foul line", () => {
    expect(canStartSwipe("idle", open, { x: 0, y: FOUL_LINE + 0.1 })).toBe(
      false,
    );
  });

  it("refuses a Swipe starting off the approach", () => {
    const beside = { x: LANE_WIDTH / 2 + 0.05, y: FOUL_LINE - 0.1 };
    const before = { x: 0, y: -0.05 };

    expect(canStartSwipe("idle", open, beside)).toBe(false);
    expect(canStartSwipe("idle", open, before)).toBe(false);
    expect(canStartSwipe("idle", open, undefined)).toBe(false);
  });
});

describe("the Swipe limit", () => {
  const screen = { left: 0, top: 100, width: 300, height: 900 };

  it("lets the finger roam the bottom two fifths of the screen", () => {
    expect(pastSwipeLimit(1_000, screen)).toBe(false);
    expect(pastSwipeLimit(640, screen)).toBe(false);
  });

  it("calls a Foul once the finger goes above it", () => {
    expect(pastSwipeLimit(639, screen)).toBe(true);
  });
});
