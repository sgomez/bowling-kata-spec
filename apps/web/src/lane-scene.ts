import type { Pin } from "@bowling/domain";
import {
  AmbientLight,
  BufferGeometry,
  Color,
  DirectionalLight,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import type { Spot } from "./knock.js";
import {
  BALL_RADIUS,
  FOUL_LINE,
  LANE_LENGTH,
  LANE_WIDTH,
} from "./lane-geometry.js";
import { ballMesh, pinGeometry, pinMaterial } from "./lane-models.js";
import type { LaneCamera } from "./lane-projection.js";
import type { SwipeSample } from "./swipe.js";

export interface LaneView {
  pins: ReadonlyMap<Pin, Spot>;
  ball: Spot;
  trail: readonly SwipeSample[];
}

export interface LaneScene {
  draw(view: LaneView, camera: LaneCamera): void;
  dispose(): void;
}

const MAX_PIXEL_RATIO = 2;
const GUTTER_WIDTH = 0.12;

// Lane metres to world: x across, y up, z = -(along the Lane).
const world = ({ x, y }: Spot, height = 0) => new Vector3(x, height, -y);

const strip = (width: number, length: number, colour: string) => {
  const mesh = new Mesh(
    new PlaneGeometry(width, length),
    new MeshStandardMaterial({ color: colour, roughness: 0.25 }),
  );
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
};

const floor = (scene: Scene) => {
  const lane = strip(LANE_WIDTH, LANE_LENGTH, "#D9B274");
  lane.position.set(0, 0, -LANE_LENGTH / 2);
  const foul = strip(LANE_WIDTH, 0.012, "#8A3F1C");
  foul.position.set(0, 0.001, -FOUL_LINE);
  scene.add(lane, foul);
  for (const side of [-1, 1]) {
    const gutter = strip(GUTTER_WIDTH, LANE_LENGTH, "#090712");
    const x = (side * (LANE_WIDTH + GUTTER_WIDTH)) / 2;
    gutter.position.set(x, -0.01, -LANE_LENGTH / 2);
    scene.add(gutter);
  }
};

export const createLaneScene = (
  canvas: HTMLCanvasElement,
  ballColour: string,
): LaneScene => {
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO),
  );
  const scene = new Scene();
  scene.background = new Color("#090712");
  scene.add(new AmbientLight("#ffffff", 1.2));
  const sun = new DirectionalLight("#ffffff", 1.6);
  sun.position.set(0.5, 3, 1);
  scene.add(sun);
  floor(scene);

  const geometry = pinGeometry();
  const material = pinMaterial();
  const pins = new Map<Pin, Mesh>();
  const ball = ballMesh(ballColour);
  const trail = new Line(
    new BufferGeometry(),
    new LineBasicMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0.6,
    }),
  );
  scene.add(ball, trail);
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
      trail.geometry.setFromPoints(view.trail.map((s) => world(s, 0.002)));
      aim(camera);
      renderer.render(scene, lens);
    },
    dispose() {
      renderer.dispose();
    },
  };
};
