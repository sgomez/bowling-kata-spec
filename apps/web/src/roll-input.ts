import type { Pin } from "@bowling/domain";
import type { ComponentType } from "preact";

export interface RollInputProps {
  standing: readonly Pin[];
  ball: string;
  onRoll: (knocked: Pin[]) => void;
  endsAt: number;
  now: () => number;
  onMiss: () => void;
  // Finished the Frame: the Lane only plays out the last Roll.
  finished: boolean;
  onPlayed: () => void;
}

export type RollInput = ComponentType<RollInputProps>;
