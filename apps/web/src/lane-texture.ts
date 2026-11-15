import { CanvasTexture, SRGBColorSpace } from "three";
import {
  FOUL_LINE,
  HEAD_PIN,
  LANE_LENGTH,
  LANE_WIDTH,
} from "./lane-geometry.js";
import { ARROWS, GUIDE_DOTS } from "./lane-marks.js";

const WIDTH = 256;
const HEIGHT = 1024;
const BOARDS = 39;
const DECK = HEAD_PIN - 0.12;
const MARK = "#8A3F1C";

// Canvas pixels from Lane metres; the canvas top is the Pins' end.
const px = (x: number) => ((x + LANE_WIDTH / 2) / LANE_WIDTH) * WIDTH;
const py = (y: number) => (1 - y / LANE_LENGTH) * HEIGHT;
const across = WIDTH / LANE_WIDTH;
const DOT = 0.009;

const wood = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = "#E7C489";
  ctx.fillRect(0, py(FOUL_LINE), WIDTH, HEIGHT);
  const lane = ctx.createLinearGradient(0, py(FOUL_LINE), 0, py(DECK));
  lane.addColorStop(0, "#EFCF96");
  lane.addColorStop(1, "#D9B274");
  ctx.fillStyle = lane;
  ctx.fillRect(0, py(DECK), WIDTH, py(FOUL_LINE) - py(DECK));
  ctx.fillStyle = "#B98A5A";
  ctx.fillRect(0, 0, WIDTH, py(DECK));
};

// Deterministic, so every Bowler sees the same grain.
const planks = (ctx: CanvasRenderingContext2D) => {
  const board = WIDTH / BOARDS;
  for (let i = 0; i < BOARDS; i++) {
    const tone = ((i * 37) % 11) / 11;
    ctx.fillStyle = `rgba(${tone > 0.5 ? "255,240,210" : "120,70,30"},${0.03 + tone * 0.05})`;
    ctx.fillRect(i * board, 0, board, HEIGHT);
  }
  ctx.fillStyle = "rgba(90,50,20,0.25)";
  for (let i = 1; i < BOARDS; i++) ctx.fillRect(i * board, 0, 1, HEIGHT);
};

// The neon above the pit, caught in the varnish.
const sheen = (ctx: CanvasRenderingContext2D) => {
  const pink = ctx.createLinearGradient(0, 0, 0, py(HEAD_PIN - 0.4));
  pink.addColorStop(0, "rgba(255,61,139,0.18)");
  pink.addColorStop(1, "rgba(255,61,139,0)");
  ctx.fillStyle = pink;
  ctx.fillRect(0, 0, WIDTH, py(HEAD_PIN - 0.4));
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.fillRect(WIDTH / 2 - 6, 0, 12, py(FOUL_LINE));
};

const marks = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = "#1A1210";
  ctx.fillRect(0, py(FOUL_LINE) - 3, WIDTH, 6);
  ctx.fillStyle = MARK;
  for (const { x, y } of ARROWS) {
    ctx.beginPath();
    ctx.moveTo(px(x), py(y));
    ctx.lineTo(px(x) - 0.014 * across, py(y - 0.08));
    ctx.lineTo(px(x) + 0.014 * across, py(y - 0.08));
    ctx.fill();
  }
  for (const { x, y } of GUIDE_DOTS) {
    ctx.beginPath();
    ctx.ellipse(
      px(x),
      py(y),
      DOT * across,
      (DOT * HEIGHT) / LANE_LENGTH,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
};

export const laneTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (ctx) for (const paint of [wood, planks, sheen, marks]) paint(ctx);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
};
