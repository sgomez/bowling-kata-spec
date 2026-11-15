import { render } from "preact-render-to-string";
import { describe, expect, it, vi } from "vitest";
import { FOUL_PAUSE_MS, useSwipe } from "../src/lane-swipe.js";

const swipeOnLane = (onPlayed = () => {}) => {
  let swipe: ReturnType<typeof useSwipe> | undefined;
  const Probe = () => {
    swipe = useSwipe(onPlayed);
    return null;
  };
  render(<Probe />);
  return swipe as ReturnType<typeof useSwipe>;
};

const gesture = [
  { x: 0, y: 0, t: 0 },
  { x: 0, y: 0.3, t: 50 },
  { x: 0, y: 0.6, t: 100 },
];

describe("a Swipe on the Lane", () => {
  it("aims while the finger is down and reads the Swipe on release", () => {
    const swipe = swipeOnLane();
    swipe.start(gesture[0]);
    swipe.extend(gesture.slice(1));

    expect(swipe.aiming()).toBe(true);
    expect(swipe.marks(0).aim.length).toBeGreaterThan(0);
    expect(swipe.release()).toMatchObject({ release: 0, direction: 0 });
    expect(swipe.aiming()).toBe(false);
  });

  it("reads no Swipe from a tap", () => {
    const swipe = swipeOnLane();
    swipe.start(gesture[0]);

    expect(swipe.release()).toBeUndefined();
  });

  it("fades the trail out after release", () => {
    const swipe = swipeOnLane();
    swipe.start(gesture[0]);
    swipe.extend(gesture.slice(1));
    swipe.release();

    expect(swipe.marks(performance.now() + 1_000).opacity).toBe(0);
  });

  it("shows the hint until the first Swipe, but not once time is up", () => {
    const swipe = swipeOnLane();

    expect(render(swipe.overlay(false, true))).not.toBe("");
    expect(render(swipe.overlay(true, true))).toBe("");
  });

  it("draws the Swipe limit while the Frame is still to play", () => {
    const swipe = swipeOnLane();

    expect(render(swipe.overlay(false, false))).toContain("swipe-limit");
    expect(render(swipe.overlay(false, true))).not.toContain("swipe-limit");
  });

  it("calls a Foul when the finger goes past the Swipe limit", () => {
    const swipe = swipeOnLane();
    const screen = {
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 300,
        height: 900,
      }),
    };
    swipe.start(gesture[0]);

    expect(
      swipe.overstepped({ clientY: 700, currentTarget: screen as never }),
    ).toBe(false);
    expect(swipe.aiming()).toBe(true);
    expect(
      swipe.overstepped({ clientY: 500, currentTarget: screen as never }),
    ).toBe(true);
    expect(swipe.aiming()).toBe(false);
  });

  it("holds the Lane on a Foul until it has been read", () => {
    vi.useFakeTimers();
    const shown = vi.fn();
    const swipe = swipeOnLane(shown);
    const screen = { getBoundingClientRect: () => ({ top: 0, height: 900 }) };
    swipe.start(gesture[0]);
    swipe.overstepped({ clientY: 0, currentTarget: screen as never });

    vi.advanceTimersByTime(FOUL_PAUSE_MS - 1);
    expect(shown).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(shown).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it("lets the next Swipe cut the Foul's pause short", () => {
    vi.useFakeTimers();
    const shown = vi.fn();
    const swipe = swipeOnLane(shown);
    const screen = { getBoundingClientRect: () => ({ top: 0, height: 900 }) };
    swipe.start(gesture[0]);
    swipe.overstepped({ clientY: 0, currentTarget: screen as never });
    swipe.start(gesture[0]);

    expect(shown).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(FOUL_PAUSE_MS);
    expect(shown).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
