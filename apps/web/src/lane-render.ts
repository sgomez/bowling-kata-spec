import type { Pin } from "@bowling/domain";
import type { Spot } from "./knock.js";
import {
  BALL_RADIUS,
  FOUL_LINE,
  LANE_LENGTH,
  LANE_WIDTH,
  PIN_RADIUS,
} from "./lane-geometry.js";
import type { SwipeSample } from "./swipe.js";

export interface LaneScene {
  pins: ReadonlyMap<Pin, Spot>;
  ball: Spot;
  trail: readonly SwipeSample[];
}

const fit = (canvas: HTMLCanvasElement) => {
  const ratio = window.devicePixelRatio || 1;
  const width = Math.round(canvas.clientWidth * ratio);
  const height = Math.round(canvas.clientHeight * ratio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  return width / LANE_WIDTH;
};

const disc = (
  ctx: CanvasRenderingContext2D,
  { x, y }: Spot,
  radius: number,
  fill: string,
) => {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
};

export const drawLane = (canvas: HTMLCanvasElement, scene: LaneScene) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const scale = fit(canvas);
  ctx.setTransform(scale, 0, 0, -scale, canvas.width / 2, canvas.height);

  ctx.fillStyle = "#d9a86c";
  ctx.fillRect(-LANE_WIDTH / 2, 0, LANE_WIDTH, LANE_LENGTH);
  ctx.fillStyle = "#c4904f";
  ctx.fillRect(-LANE_WIDTH / 2, 0, LANE_WIDTH, FOUL_LINE);
  ctx.fillStyle = "#7a4a1c";
  ctx.fillRect(-LANE_WIDTH / 2, FOUL_LINE - 0.005, LANE_WIDTH, 0.01);

  if (scene.trail.length > 1) {
    ctx.beginPath();
    for (const { x, y } of scene.trail) ctx.lineTo(x, y);
    ctx.strokeStyle = "rgb(255 255 255 / 0.6)";
    ctx.lineWidth = 0.02;
    ctx.stroke();
  }

  for (const spot of scene.pins.values()) {
    disc(ctx, spot, PIN_RADIUS, "#fafafa");
    disc(ctx, spot, PIN_RADIUS / 2.5, "#c22");
  }

  const limit = LANE_WIDTH / 2 - BALL_RADIUS / 2;
  const x = Math.max(-limit, Math.min(limit, scene.ball.x));
  disc(ctx, { x, y: scene.ball.y }, BALL_RADIUS, "#1d3c78");
};
