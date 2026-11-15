import { PINS, type Pin } from "@bowling/domain";

const ROWS: readonly (readonly Pin[])[] = [
  [7, 8, 9, 10],
  [4, 5, 6],
  [2, 3],
  [1],
];
const SPACING = 11.5;
const CENTRE = 23.25;

export const PinMap = ({ standing }: { standing: readonly Pin[] }) => (
  <svg
    role="img"
    aria-label={`Bolos en pie: ${standing.length} de ${PINS.length}`}
    class="pin-map"
    width="46"
    height="42"
    viewBox="0 0 46.5 42"
  >
    {ROWS.flatMap((row, r) =>
      row.map((pin, c) => (
        <circle
          key={pin}
          class={standing.includes(pin) ? "standing" : "down"}
          cx={CENTRE + (c - (row.length - 1) / 2) * SPACING}
          cy={6 + r * 10}
          r={standing.includes(pin) ? 4.2 : 3.4}
        />
      )),
    )}
  </svg>
);
