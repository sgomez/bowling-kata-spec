import type { BowlerColour } from "@bowling/domain";

const HEX = [
  "#FF3D8B",
  "#3DE8FF",
  "#FFC53D",
  "#5BE38B",
  "#A78BFF",
  "#FF8A3D",
] as const;

export const bowlerColour = (colour: BowlerColour) => HEX[colour];
