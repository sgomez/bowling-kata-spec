import type { BowlerColour } from "@bowling/domain";
import { AMBER, CYAN, GREEN, ORANGE, PINK, VIOLET } from "./palette.js";

const HEX = [PINK, CYAN, AMBER, GREEN, VIOLET, ORANGE] as const;

export const bowlerColour = (colour: BowlerColour) => HEX[colour];
