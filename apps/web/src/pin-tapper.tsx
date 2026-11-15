import type { Pin } from "@bowling/domain";
import { useState } from "preact/hooks";
import type { RollInputProps } from "./roll-input.js";

const RACK: Pin[][] = [[7, 8, 9, 10], [4, 5, 6], [2, 3], [1]];

export const toggle = (knocked: readonly Pin[], pin: Pin): Pin[] =>
  knocked.includes(pin) ? knocked.filter((p) => p !== pin) : [...knocked, pin];

export const PinTapper = ({ standing, onRoll }: RollInputProps) => {
  const [knocked, setKnocked] = useState<Pin[]>([]);

  return (
    <div class="pin-tapper">
      <p>Toca los bolos que quieres derribar.</p>
      {RACK.map((row) => (
        <div class="pin-row" key={row[0]}>
          {row.map((pin) => (
            <button
              type="button"
              class="pin"
              key={pin}
              aria-label={`Bolo ${pin}`}
              aria-pressed={knocked.includes(pin)}
              disabled={!standing.includes(pin)}
              onClick={() => setKnocked(toggle(knocked, pin))}
            >
              {pin}
            </button>
          ))}
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          onRoll(knocked);
          setKnocked([]);
        }}
      >
        Lanzar ({knocked.length} {knocked.length === 1 ? "bolo" : "bolos"})
      </button>
    </div>
  );
};
