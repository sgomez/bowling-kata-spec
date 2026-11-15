import type { Scene, SpriteMaterial } from "three";
import type { Staging } from "./lane-choreography.js";
import { BALL_RADIUS, LANE_LENGTH } from "./lane-geometry.js";
import { glow } from "./lane-glow.js";

const FRONT_Y = LANE_LENGTH + 0.28;
const FRONT_H = 0.6;

// The impact flash and the front lights that flash for a Strike or a Spare.
export const createCheers = (scene: Scene) => {
  const flash = glow("#FFFFFF", 0);
  flash.scale.setScalar(BALL_RADIUS * 9);
  const front = glow("#FF3D8B", 0);
  front.scale.set(3.2, 1.2, 1);
  front.position.set(0, FRONT_H, -FRONT_Y);
  scene.add(flash, front);
  const shine = (material: SpriteMaterial, opacity: number) => {
    material.opacity = opacity;
    material.visible = opacity > 0;
  };

  return (view: Staging) => {
    flash.position.set(view.ball.x, BALL_RADIUS, -view.ball.y);
    shine(flash.material, view.flash);
    const { celebration } = view;
    front.material.color.set(
      celebration?.kind === "spare" ? "#3DE8FF" : "#FF3D8B",
    );
    shine(front.material, celebration?.lights ?? 0);
  };
};
