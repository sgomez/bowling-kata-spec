import { MAX_SPEED, type Swipe } from "./swipe.js";

const LEVELS = 5;

const SPINLESS = 0.1;

const levelOf = (swipe: Swipe | undefined) =>
  swipe ? Math.max(1, Math.ceil((swipe.speed / MAX_SPEED) * LEVELS)) : 0;

const sideOf = (swipe: Swipe | undefined) => {
  if (!swipe || Math.abs(swipe.spin) < SPINLESS) return undefined;
  return swipe.spin < 0 ? "izquierda" : "derecha";
};

export const SwipeGauge = ({ swipe }: { swipe: Swipe | undefined }) => {
  const level = levelOf(swipe);
  const side = sideOf(swipe);
  return (
    <div class="swipe-gauge">
      <div class="swipe-gauge-panel">
        <span class="swipe-gauge-label">Velocidad</span>
        <span
          class="swipe-gauge-bars"
          role="img"
          aria-label={`Velocidad: ${level} de ${LEVELS}`}
        >
          {Array.from({ length: LEVELS }, (_, bar) => (
            <span key={bar} class={bar < level ? "lit" : undefined} />
          ))}
        </span>
      </div>
      <div class="swipe-gauge-panel">
        <span class="swipe-gauge-label">Efecto</span>
        <span class="swipe-gauge-spin">
          {side && (
            <svg
              aria-hidden="true"
              class={side}
              width="30"
              height="24"
              viewBox="0 0 30 24"
            >
              <path d="M22 22 C26 12 20 5 6 5" />
              <path d="M11 1 L6 5 L11 9" />
            </svg>
          )}
          {side ?? "sin efecto"}
        </span>
      </div>
    </div>
  );
};

const HAND = [
  "M22 14a8 8 0 0 1-8 8",
  "M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2",
  "M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1",
  "M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10",
  "M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15",
];

export const SwipeHint = () => (
  <div class="swipe-hint">
    <p>
      <strong>Desliza hacia arriba para lanzar</strong>
      <span>Curva el gesto para darle efecto</span>
    </p>
    <svg class="swipe-hint-hand" aria-hidden="true" viewBox="0 0 24 24">
      {HAND.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  </div>
);
