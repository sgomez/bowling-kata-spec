import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runLane } from "../src/lane-loop.js";
import type { LaneView } from "../src/lane-scene.js";

const scene = { draw: vi.fn(), dispose: vi.fn() };
const createLaneScene = vi.fn(() => scene);

// The scene is three.js, which needs a real WebGL canvas.
vi.mock("../src/lane-scene.js", () => ({ createLaneScene }));

let frames: FrameRequestCallback[] = [];
const nextFrame = (now: number) => {
  const pending = frames;
  frames = [];
  for (const frame of pending) frame(now);
};
const loaded = () => vi.dynamicImportSettled();

beforeEach(() => {
  frames = [];
  vi.clearAllMocks();
  vi.stubGlobal("requestAnimationFrame", (frame: FrameRequestCallback) => {
    frames.push(frame);
    return frames.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {
    frames = [];
  });
});

afterEach(() => vi.unstubAllGlobals());

const canvas = {} as HTMLCanvasElement;
const view = {} as LaneView;

describe("the Lane's drawing loop", () => {
  it("draws what the frame returns once the scene loads, every frame", async () => {
    const frame = vi.fn(() => view);
    runLane(canvas, "#fff", frame);
    await loaded();

    nextFrame(16);
    nextFrame(32);

    expect(createLaneScene).toHaveBeenCalledWith(canvas, "#fff");
    expect(frame).toHaveBeenLastCalledWith(32);
    expect(scene.draw).toHaveBeenCalledTimes(2);
  });

  it("stops drawing and frees the scene when stopped", async () => {
    const stop = runLane(canvas, "#fff", () => view);
    await loaded();

    stop();
    nextFrame(16);

    expect(scene.draw).not.toHaveBeenCalled();
    expect(scene.dispose).toHaveBeenCalled();
  });

  it("never builds the scene if stopped before it loads", async () => {
    runLane(canvas, "#fff", () => view)();
    await loaded();

    expect(createLaneScene).not.toHaveBeenCalled();
  });
});
