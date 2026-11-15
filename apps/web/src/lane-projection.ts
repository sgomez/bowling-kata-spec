import type { Spot } from "./knock.js";

// In Lane metres; tilt (downwards) and vertical fov in degrees.
export interface LaneCamera {
  x: number;
  y: number;
  height: number;
  tilt: number;
  fov: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface Viewport {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Fitted to the design's "Juego · preparado" artboard.
export const REST_CAMERA: LaneCamera = {
  x: 0,
  y: -1.89,
  height: 2.43,
  tilt: 28.5,
  fov: 56,
};

const radians = (degrees: number) => (degrees * Math.PI) / 180;

const lens = (viewport: Viewport, camera: LaneCamera) => {
  const half = Math.tan(radians(camera.fov) / 2);
  return {
    tilt: radians(camera.tilt),
    half,
    aspect: viewport.width / viewport.height,
  };
};

export const toLanePoint = (
  point: ScreenPoint,
  viewport: Viewport,
  camera: LaneCamera,
): Spot | undefined => {
  const { tilt, half, aspect } = lens(viewport, camera);
  const across = ((point.x - viewport.left) / viewport.width) * 2 - 1;
  const up = 1 - ((point.y - viewport.top) / viewport.height) * 2;
  const right = across * half * aspect;
  const raised = up * half;
  const forward = raised * Math.sin(tilt) + Math.cos(tilt);
  const fall = Math.sin(tilt) - raised * Math.cos(tilt);
  if (fall <= 0) return undefined;
  const distance = camera.height / fall;
  return { x: camera.x + distance * right, y: camera.y + distance * forward };
};

export const toScreenPoint = (
  point: Spot & { z: number },
  viewport: Viewport,
  camera: LaneCamera,
): ScreenPoint => {
  const { tilt, half, aspect } = lens(viewport, camera);
  const along = point.y - camera.y;
  const above = point.z - camera.height;
  const depth = along * Math.cos(tilt) - above * Math.sin(tilt);
  const raised = along * Math.sin(tilt) + above * Math.cos(tilt);
  const across = (point.x - camera.x) / depth / (half * aspect);
  const up = raised / depth / half;
  return {
    x: viewport.left + ((across + 1) / 2) * viewport.width,
    y: viewport.top + ((1 - up) / 2) * viewport.height,
  };
};
