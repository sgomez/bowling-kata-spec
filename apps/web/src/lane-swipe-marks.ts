import {
  BufferGeometry,
  Float32BufferAttribute,
  Line,
  LineDashedMaterial,
  Mesh,
  MeshBasicMaterial,
  type Scene,
  Vector3,
} from "three";
import type { Spot } from "./knock.js";

// Lane metres; width and opacity come from swipe-trail.
export interface SwipeMarks {
  trail: readonly Spot[];
  width: number;
  opacity: number;
  aim: readonly Spot[];
}

export const NO_MARKS: SwipeMarks = {
  trail: [],
  width: 0,
  opacity: 0,
  aim: [],
};

const TRAIL = "#FF3D8B";
const AIM = "#3DE8FF";
const GLOW = 2.2;
const LIFT = 0.003;

const ribbon = (points: readonly Spot[], width: number) => {
  const vertices: number[] = [];
  const index: number[] = [];
  points.forEach((point, i) => {
    const from = points[Math.max(0, i - 1)] as Spot;
    const to = points[Math.min(points.length - 1, i + 1)] as Spot;
    const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
    const across = (width / 2 / length) * (to.y - from.y);
    const along = (width / 2 / length) * (to.x - from.x);
    vertices.push(point.x - across, LIFT, -(point.y + along));
    vertices.push(point.x + across, LIFT, -(point.y - along));
    if (i > 0) {
      const a = 2 * (i - 1);
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(index);
  return geometry;
};

const glowing = (opacity: number) =>
  new MeshBasicMaterial({
    color: TRAIL,
    transparent: true,
    opacity,
    depthWrite: false,
  });

export const createSwipeMarks = (scene: Scene) => {
  const glow = new Mesh(new BufferGeometry(), glowing(0.22));
  const core = new Mesh(new BufferGeometry(), glowing(0.55));
  const aimMaterial = new LineDashedMaterial({
    color: AIM,
    dashSize: 0.02,
    gapSize: 0.06,
    transparent: true,
  });
  const aim = new Line(new BufferGeometry(), aimMaterial);
  scene.add(glow, core, aim);

  const swap = (target: Mesh | Line, geometry: BufferGeometry) => {
    target.geometry.dispose();
    target.geometry = geometry;
  };

  return {
    draw({ trail, width, opacity, aim: path }: SwipeMarks) {
      const visible = opacity > 0 && trail.length > 1;
      glow.visible = core.visible = visible;
      aim.visible = opacity > 0 && path.length > 1;
      if (visible) {
        swap(glow, ribbon(trail, width * GLOW));
        swap(core, ribbon(trail, width));
        glow.material.opacity = 0.22 * opacity;
        core.material.opacity = 0.55 * opacity;
      }
      if (aim.visible) {
        const line = new BufferGeometry().setFromPoints(
          path.map(({ x, y }) => new Vector3(x, LIFT, -y)),
        );
        swap(aim, line);
        aim.computeLineDistances();
        aimMaterial.opacity = opacity;
      }
    },
  };
};
