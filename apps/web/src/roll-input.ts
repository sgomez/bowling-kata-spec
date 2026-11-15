import type { Pin } from "@bowling/domain";
import type { ComponentType } from "preact";

export interface RollInputProps {
  standing: readonly Pin[];
  ball: string;
  onRoll: (knocked: Pin[]) => void;
  endsAt: number;
  now: () => number;
  onMiss: () => void;
}

export type RollInput = ComponentType<RollInputProps>;
