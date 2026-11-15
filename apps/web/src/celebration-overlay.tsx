import "./styles/celebration.css";
import { AMBER, CYAN, GREEN, PINK, VIOLET } from "./palette.js";

const COLOURS = [PINK, CYAN, AMBER, GREEN, VIOLET];
const PIECES = 18;

// Spread evenly across the Lane, staggered so they don't fall in a line.
const confetti = Array.from({ length: PIECES }, (_, i) => ({
  left: `${((i * 37) % 100).toFixed(0)}%`,
  delay: `${(i % 6) * 60}ms`,
  colour: COLOURS[i % COLOURS.length],
}));

export const CelebrationOverlay = () => (
  <div class="celebration" aria-hidden="true">
    <span class="celebration-beam left" />
    <span class="celebration-beam right" />
    {confetti.map(({ left, delay, colour }) => (
      <span
        key={delay + left}
        class="celebration-confetti"
        style={{ left, animationDelay: delay, background: colour }}
      />
    ))}
  </div>
);
