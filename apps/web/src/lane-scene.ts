import type { Pin } from "@bowling/domain";
import {
  AmbientLight,
  Color,
  DirectionalLight,
  Mesh,
  PerspectiveCamera,
  Scene,
  Vector2,
  WebGLRenderer,
} from "three";
import { poseBall, posePin } from "./lane-actors.js";
import type { Staging } from "./lane-choreography.js";
import { BALL_RADIUS } from "./lane-geometry.js";
import { glow } from "./lane-glow.js";
import { overBudget } from "./lane-marks.js";
import { ballMesh, pinGeometry, pinMaterial } from "./lane-models.js";
import type { LaneCamera } from "./lane-projection.js";
import { createReflections } from "./lane-reflection.js";
import { buildSet } from "./lane-set.js";
import { createSwipeMarks, type SwipeMarks } from "./lane-swipe-marks.js";

export interface LaneView extends Staging {
  marks: SwipeMarks;
}

export interface LaneScene {
  draw(view: LaneView, camera: LaneCamera): void;
  dispose(): void;
}

const MAX_PIXEL_RATIO = 2;

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

  const placePins = (staged: Staging["pins"]) => {
    for (const [pin, mesh] of pins) mesh.visible = staged.has(pin);
    for (const [pin, staging] of staged) {
      let mesh = pins.get(pin);
      if (!mesh) {
        mesh = new Mesh(geometry, material.clone());
        pins.set(pin, mesh);
        scene.add(mesh);
      }
      posePin(mesh, staging);
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
      poseBall(ball, view.ball);
      halo.position.copy(ball.position);
      halo.visible = !view.ball.gutter;
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
