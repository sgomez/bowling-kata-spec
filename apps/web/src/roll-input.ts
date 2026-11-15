import type { Pin } from "@bowling/domain";
import type { ComponentType } from "preact";

export interface RollInputProps {
  standing: readonly Pin[];
  onRoll: (knocked: Pin[]) => void;
}

export type RollInput = ComponentType<RollInputProps>;
