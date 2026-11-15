import type { Mesh, MeshStandardMaterial } from "three";
import { Vector3 } from "three";
import type { BallStaging, PinStaging } from "./lane-choreography.js";
import { BALL_RADIUS, GUTTER_WIDTH, LANE_WIDTH } from "./lane-geometry.js";

const GUTTER_DROP = 0.04;
const axis = new Vector3();

// Lane metres to world: x across, y up, z = -(along the Lane).
export const posePin = (mesh: Mesh, pin: PinStaging) => {
  mesh.visible = pin.state !== "removed";
  mesh.position.set(pin.x, 0, -pin.y);
  // Up × the push direction, so a positive tilt tips the top that way.
  axis.set(-Math.cos(pin.direction), 0, -Math.sin(pin.direction));
  mesh.quaternion.setFromAxisAngle(axis, pin.tilt);
  const material = mesh.material as MeshStandardMaterial;
  material.transparent = pin.opacity < 1;
  material.opacity = pin.opacity;
};

export const poseBall = (mesh: Mesh, ball: BallStaging) => {
  const limit = LANE_WIDTH / 2 - BALL_RADIUS / 2;
  const x = ball.gutter
    ? (Math.sign(ball.x) * (LANE_WIDTH + GUTTER_WIDTH)) / 2
    : Math.max(-limit, Math.min(limit, ball.x));
  const drop = ball.gutter ? GUTTER_DROP : 0;
  mesh.position.set(x, BALL_RADIUS - drop, -ball.y);
  // Rolls about the axis across the Lane, spins about the vertical.
  mesh.rotation.set(-ball.roll, ball.spin, 0, "YXZ");
};
