import type { LaneScene, LaneView } from "./lane-scene.js";

const scenery = () => import("./lane-scene.js");

// Loads the scene on demand and draws whatever `frame` returns, every frame.
export const runLane = (
  canvas: HTMLCanvasElement,
  ballColour: string,
  frame: (now: number) => LaneView,
) => {
  let scene: LaneScene | undefined;
  let gone = false;
  scenery().then(({ createLaneScene }) => {
    if (!gone) scene = createLaneScene(canvas, ballColour);
  });
  let request = 0;
  const tick = (now: number) => {
    scene?.draw(frame(now));
    request = requestAnimationFrame(tick);
  };
  request = requestAnimationFrame(tick);
  return () => {
    gone = true;
    cancelAnimationFrame(request);
    scene?.dispose();
  };
};
