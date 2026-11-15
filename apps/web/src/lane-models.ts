import {
  BufferAttribute,
  CanvasTexture,
  Color,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
} from "three";
import { BALL_RADIUS, PIN_HEIGHT, PIN_RADIUS } from "./lane-geometry.js";

// Pin profile as [height, radius], both as fractions of the Pin's size.
const PROFILE = [
  [0, 0.53],
  [0.03, 0.66],
  [0.12, 0.88],
  [0.24, 1],
  [0.36, 0.93],
  [0.48, 0.7],
  [0.58, 0.44],
  [0.61, 0.4],
  [0.64, 0.4],
  [0.67, 0.43],
  [0.78, 0.53],
  [0.9, 0.5],
  [0.97, 0.3],
  [1, 0],
] as const;
// The profile's points bound the stripes, so whole faces turn red.
const STRIPES = [
  [0.58, 0.61],
  [0.64, 0.67],
] as const;
const STRIPE = new Color("#E5263A");
const WHITE = new Color("#FFFFFF");

export const pinGeometry = () => {
  const geometry = new LatheGeometry(
    PROFILE.map(([h, r]) => new Vector2(r * PIN_RADIUS, h * PIN_HEIGHT)),
    12,
  ).toNonIndexed();
  const heights = geometry.getAttribute("position");
  const colours = new Float32Array(heights.count * 3);
  for (let i = 0; i < heights.count; i += 3) {
    const h =
      (heights.getY(i) + heights.getY(i + 1) + heights.getY(i + 2)) /
      3 /
      PIN_HEIGHT;
    const red = STRIPES.some(([from, to]) => h > from && h < to);
    for (let v = i; v < i + 3; v++) {
      (red ? STRIPE : WHITE).toArray(colours, v * 3);
    }
  }
  geometry.setAttribute("color", new BufferAttribute(colours, 3));
  return geometry;
};

export const pinMaterial = () =>
  new MeshStandardMaterial({ vertexColors: true, roughness: 0.3 });

const fingerHoles = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 128, 64);
    ctx.fillStyle = "#1a1a1a";
    for (const [x, y, r] of [
      [60, 20, 4],
      [68, 20, 4],
      [64, 32, 5],
    ] as const) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
};

export const ballMesh = (colour: string) =>
  new Mesh(
    new SphereGeometry(BALL_RADIUS, 24, 16),
    new MeshStandardMaterial({
      color: colour,
      map: fingerHoles(),
      roughness: 0.15,
      metalness: 0.1,
    }),
  );
