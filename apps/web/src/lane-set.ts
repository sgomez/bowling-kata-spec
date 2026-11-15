import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  type Scene,
} from "three";
import { FOUL_LINE, LANE_LENGTH, LANE_WIDTH } from "./lane-geometry.js";
import { glow } from "./lane-glow.js";
import { laneTexture } from "./lane-texture.js";

// Lane metres: x across, y along the Lane, h up.
type Corner = [x: number, y: number, h: number];
type Range = [from: number, to: number];

interface Area {
  x: Range;
  y: Range;
  h?: number;
}

const GUTTER = 0.12;
const GUTTER_DEPTH = 0.05;
const EDGE = LANE_WIDTH / 2 + GUTTER;
const SIDE = 2.5;
const BEHIND = -1.5;
const PIT = LANE_LENGTH + 0.45;
const MASK_Y = LANE_LENGTH + 0.3;
const MASK_FROM = 0.3;
const MASK_TO = 1.2;
const NEON_H = 0.5;

class Quads {
  positions: number[] = [];
  colours: number[] = [];

  add(colour: string, a: Corner, b: Corner, c: Corner, d: Corner) {
    const tint = new Color(colour).toArray();
    for (const [x, y, h] of [a, b, c, a, c, d]) {
      this.positions.push(x, h, -y);
      this.colours.push(...tint);
    }
  }

  geometry() {
    const geometry = new BufferGeometry();
    const at = (values: number[]) =>
      new BufferAttribute(new Float32Array(values), 3);
    geometry.setAttribute("position", at(this.positions));
    geometry.setAttribute("color", at(this.colours));
    geometry.computeVertexNormals();
    return geometry;
  }
}

const floor = (
  q: Quads,
  colour: string,
  { x: [x0, x1], y: [y0, y1], h = 0 }: Area,
) => q.add(colour, [x0, y0, h], [x1, y0, h], [x1, y1, h], [x0, y1, h]);

const GUTTER_RUN: Range = [FOUL_LINE, LANE_LENGTH];

// Facing (±1) picks the winding, so each wall faces into the gutter.
const wall = (q: Quads, colour: string, x: number, facing: number) => {
  const [a, b] = facing > 0 ? GUTTER_RUN : [GUTTER_RUN[1], GUTTER_RUN[0]];
  q.add(
    colour,
    [x, a, -GUTTER_DEPTH],
    [x, b, -GUTTER_DEPTH],
    [x, b, 0],
    [x, a, 0],
  );
};

const surroundings = () => {
  const q = new Quads();
  floor(q, "#E7C489", { x: [-EDGE, EDGE], y: [BEHIND, 0] });
  for (const s of [-1, 1]) {
    const [inner, outer] = [(s * LANE_WIDTH) / 2, s * EDGE];
    const x: Range = s < 0 ? [outer, inner] : [inner, outer];
    floor(q, "#E7C489", { x, y: [0, FOUL_LINE] });
    floor(q, "#33273A", { x, y: GUTTER_RUN, h: -GUTTER_DEPTH });
    wall(q, "#1A1430", inner, s);
    wall(q, "#1A1430", outer, -s);
    const side: Range = s < 0 ? [-SIDE, outer] : [outer, SIDE];
    floor(q, "#090712", { x: side, y: [BEHIND, LANE_LENGTH] });
  }
  floor(q, "#040309", {
    x: [-SIDE, SIDE],
    y: [LANE_LENGTH, PIT],
    h: -GUTTER_DEPTH,
  });
  q.add(
    "#040309",
    [-SIDE, PIT, -GUTTER_DEPTH],
    [SIDE, PIT, -GUTTER_DEPTH],
    [SIDE, PIT, MASK_TO],
    [-SIDE, PIT, MASK_TO],
  );
  q.add(
    "#1B1436",
    [-SIDE, MASK_Y, MASK_FROM],
    [SIDE, MASK_Y, MASK_FROM],
    [SIDE, MASK_Y, MASK_TO],
    [-SIDE, MASK_Y, MASK_TO],
  );
  return new Mesh(
    q.geometry(),
    new MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }),
  );
};

// The amber zigzag over the pit, unlit so it reads as neon.
const zigzag = () => {
  const q = new Quads();
  const y = MASK_Y - 0.005;
  const [step, rise, thick] = [0.2, 0.09, 0.012];
  for (let x = -SIDE / 2; x < SIDE / 2; x += step) {
    const up = Math.round(x / step) % 2 === 0;
    const [h0, h1] = up ? [NEON_H, NEON_H + rise] : [NEON_H + rise, NEON_H];
    q.add(
      "#FFC53D",
      [x, y, h0 - thick],
      [x + step, y, h1 - thick],
      [x + step, y, h1 + thick],
      [x, y, h0 + thick],
    );
  }
  return new Mesh(
    q.geometry(),
    new MeshBasicMaterial({ color: "#FFC53D", toneMapped: false }),
  );
};

const lane = () => {
  const mesh = new Mesh(
    new PlaneGeometry(LANE_WIDTH, LANE_LENGTH),
    // No depth, so the mirrored copies show through the varnish.
    new MeshStandardMaterial({
      map: laneTexture(),
      roughness: 0.25,
      depthWrite: false,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, 0, -LANE_LENGTH / 2);
  mesh.renderOrder = -1;
  return mesh;
};

const lights = () =>
  (
    [
      ["#FFC53D", 0.45, 0, 2.6, 0.35],
      ["#FF3D8B", 0.5, -1, 2.5, 1],
      ["#3DE8FF", 0.4, 1, 2.5, 0.9],
    ] as const
  ).map(([colour, opacity, x, w, h]) => {
    const sprite = glow(colour, opacity);
    sprite.position.set(x, NEON_H + (h > 0.5 ? 0.15 : 0.04), -(MASK_Y - 0.02));
    sprite.scale.set(w, h, 1);
    return sprite;
  });

export const buildSet = (scene: Scene) => {
  scene.add(lane(), surroundings(), zigzag(), ...lights());
};
