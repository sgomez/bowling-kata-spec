import { PINS_PER_RACK } from "@bowling/domain";

export type RollKind = "strike" | "spare" | "zero" | "count";

// A Foul only shows on the scorecard; the Lane knocks zero Pins.
type MarkKind = RollKind | "foul";

const MARKS: Partial<Record<string, MarkKind>> = {
  X: "strike",
  "/": "spare",
  "-": "zero",
  F: "foul",
};

export const kindOfMark = (mark: string): MarkKind => MARKS[mark] ?? "count";

export const kindOfKnock = (standing: number, knocked: number): RollKind => {
  if (knocked === 0) return "zero";
  if (knocked < standing) return "count";
  return standing === PINS_PER_RACK ? "strike" : "spare";
};

export const clearsRack = (mark: string | undefined) =>
  mark === "X" || mark === "/";

const pinsOf = (mark: string) =>
  kindOfMark(mark) === "count" ? Number(mark) : 0;

export const standingAfter = (marks: readonly string[]) => {
  const rack: string[] = [];
  for (const mark of marks) {
    if (clearsRack(mark)) rack.length = 0;
    else rack.push(mark);
  }
  return PINS_PER_RACK - rack.reduce((sum, mark) => sum + pinsOf(mark), 0);
};
