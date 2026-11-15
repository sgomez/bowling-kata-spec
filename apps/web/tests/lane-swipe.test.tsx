import { render } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { useSwipe } from "../src/lane-swipe.js";

const swipeOnLane = () => {
  let swipe: ReturnType<typeof useSwipe> | undefined;
  const Probe = () => {
    swipe = useSwipe();
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

    expect(render(swipe.overlay(false))).not.toBe("");
    expect(render(swipe.overlay(true))).toBe("");
  });
});
