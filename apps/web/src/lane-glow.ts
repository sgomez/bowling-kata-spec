import {
  AdditiveBlending,
  CanvasTexture,
  type ColorRepresentation,
  Sprite,
  SpriteMaterial,
  type Texture,
} from "three";

let shared: Texture | undefined;

const glowTexture = () => {
  if (shared) return shared;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const fade = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    fade.addColorStop(0, "rgba(255,255,255,1)");
    fade.addColorStop(0.4, "rgba(255,255,255,0.45)");
    fade.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, 64, 64);
  }
  shared = new CanvasTexture(canvas);
  return shared;
};

// Neon halo: an additive sprite, so it glows without post-processing.
export const glow = (colour: ColorRepresentation, opacity: number) => {
  const sprite = new Sprite(
    new SpriteMaterial({
      map: glowTexture(),
      color: colour,
      opacity,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  sprite.renderOrder = 3;
  return sprite;
};
