import { PINS_PER_RACK } from "@bowling/domain";

export type RollKind = "strike" | "spare" | "zero" | "count";

const MARKS: Partial<Record<string, RollKind>> = {
  X: "strike",
  "/": "spare",
  "-": "zero",
};

export const kindOfMark = (mark: string): RollKind => MARKS[mark] ?? "count";

export const kindOfKnock = (standing: number, knocked: number): RollKind => {
  if (knocked === 0) return "zero";
  if (knocked < standing) return "count";
  return standing === PINS_PER_RACK ? "strike" : "spare";
};

export const clearsRack = (mark: string | undefined) =>
  mark === "X" || mark === "/";

const pinsOf = (mark: string) => (mark === "-" ? 0 : Number(mark));

export const standingAfter = (marks: readonly string[]) => {
  const rack: string[] = [];
  for (const mark of marks) {
    if (clearsRack(mark)) rack.length = 0;
    else rack.push(mark);
  }
  return PINS_PER_RACK - rack.reduce((sum, mark) => sum + pinsOf(mark), 0);
};
