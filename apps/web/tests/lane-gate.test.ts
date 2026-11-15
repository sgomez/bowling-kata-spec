import { describe, expect, it } from "vitest";
import { canStartSwipe, checkTime } from "../src/lane-gate.js";
import { FOUL_LINE } from "../src/lane-geometry.js";

const open = { now: 1_000, endsAt: 2_000 };
const over = { now: 2_000, endsAt: 2_000 };
const behindFoulLine = FOUL_LINE - 0.1;

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
    expect(canStartSwipe("idle", open, FOUL_LINE + 0.1)).toBe(false);
  });
});
