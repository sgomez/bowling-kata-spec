import type { Pin } from "@bowling/domain";
import {
  AmbientLight,
  Color,
  DirectionalLight,
  Mesh,
  PerspectiveCamera,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import type { Spot } from "./knock.js";
import { BALL_RADIUS, LANE_WIDTH } from "./lane-geometry.js";
import { glow } from "./lane-glow.js";
import { overBudget } from "./lane-marks.js";
import { ballMesh, pinGeometry, pinMaterial } from "./lane-models.js";
import type { LaneCamera } from "./lane-projection.js";
import { createReflections } from "./lane-reflection.js";
import { buildSet } from "./lane-set.js";
import { createSwipeMarks, type SwipeMarks } from "./lane-swipe-marks.js";

export interface LaneView {
  pins: ReadonlyMap<Pin, Spot>;
  ball: Spot;
  marks: SwipeMarks;
}

export interface LaneScene {
  draw(view: LaneView, camera: LaneCamera): void;
  dispose(): void;
}

const MAX_PIXEL_RATIO = 2;

// Lane metres to world: x across, y up, z = -(along the Lane).
const world = ({ x, y }: Spot, height = 0) => new Vector3(x, height, -y);

export const createLaneScene = (
  canvas: HTMLCanvasElement,
  ballColour: string,
): LaneScene => {
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO),
  );
  const scene = new Scene();
  scene.background = new Color("#0B0817");
  scene.add(new AmbientLight("#ffffff", 1.2));
  const sun = new DirectionalLight("#ffffff", 1.6);
  sun.position.set(0.5, 3, 1);
  scene.add(sun);
  buildSet(scene);
  const reflections = createReflections(scene);

  const geometry = pinGeometry();
  const material = pinMaterial();
  const pins = new Map<Pin, Mesh>();
  const ball = ballMesh(ballColour);
  const halo = glow(ballColour, 0.55);
  halo.scale.setScalar(BALL_RADIUS * 5);
  scene.add(ball, halo);
  const marks = createSwipeMarks(scene);
  let warned = false;
  const lens = new PerspectiveCamera();

  const placePins = (spots: ReadonlyMap<Pin, Spot>) => {
    for (const [pin, mesh] of pins) mesh.visible = spots.has(pin);
    for (const [pin, spot] of spots) {
      let mesh = pins.get(pin);
      if (!mesh) {
        mesh = new Mesh(geometry, material);
        pins.set(pin, mesh);
        scene.add(mesh);
      }
      mesh.visible = true;
      mesh.position.copy(world(spot));
    }
  };

  const aim = (camera: LaneCamera) => {
    const { clientWidth: width, clientHeight: height } = canvas;
    const size = renderer.getSize(new Vector2());
    if (size.x !== width || size.y !== height) {
      renderer.setSize(width, height, false);
    }
    lens.aspect = width / height;
    lens.fov = camera.fov;
    lens.position.set(camera.x, camera.height, -camera.y);
    lens.rotation.set((-camera.tilt * Math.PI) / 180, 0, 0);
    lens.updateProjectionMatrix();
  };

  return {
    draw(view, camera) {
      placePins(view.pins);
      const limit = LANE_WIDTH / 2 - BALL_RADIUS / 2;
      const x = Math.max(-limit, Math.min(limit, view.ball.x));
      ball.position.copy(world({ x, y: view.ball.y }, BALL_RADIUS));
      halo.position.copy(ball.position);
      reflections.update([...pins.values(), ball]);
      marks.draw(view.marks);
      aim(camera);
      renderer.render(scene, lens);
      if (!warned && overBudget(renderer.info.render)) {
        warned = true;
        console.warn("The Lane is over budget", renderer.info.render);
      }
    },
    dispose() {
      renderer.dispose();
    },
  };
};
