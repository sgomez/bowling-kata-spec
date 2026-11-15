import { type Frame, PINS_PER_RACK, type PinCount } from "./frame.js";

const symbol = (pins: PinCount) => (pins === 0 ? "-" : String(pins));

export const notation = (frame: Frame): string[] => {
  let firstOfRack: PinCount | undefined;
  return frame.rolls.map((pins) => {
    if (firstOfRack === undefined) {
      if (pins === PINS_PER_RACK) {
        return "X";
      }
      firstOfRack = pins;
      return symbol(pins);
    }
    const isSpare = firstOfRack + pins === PINS_PER_RACK;
    firstOfRack = undefined;
    return isSpare ? "/" : symbol(pins);
  });
};
