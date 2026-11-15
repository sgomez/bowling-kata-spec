import { describe, expect, it } from "vitest";
import { leaders, standings } from "../src/standings.js";

const bowler = (id: string, total: number) => ({ id, total });

describe("Standings", () => {
  it("ranks Bowlers by total, highest first", () => {
    const ranked = standings([bowler("ana", 20), bowler("bea", 45)]);

    expect(ranked).toEqual([
      { position: 1, bowler: bowler("bea", 45) },
      { position: 2, bowler: bowler("ana", 20) },
    ]);
  });

  it("lets tied Bowlers share a position and skips the ones they take", () => {
    const ranked = standings([
      bowler("ana", 34),
      bowler("bea", 53),
      bowler("eva", 53),
      bowler("lu", 58),
      bowler("pau", 56),
    ]);

    expect(ranked.map((r) => [r.position, r.bowler.id])).toEqual([
      [1, "lu"],
      [2, "pau"],
      [3, "bea"],
      [3, "eva"],
      [5, "ana"],
    ]);
  });

  it("has no one to rank in an empty Room", () => {
    expect(standings([])).toEqual([]);
  });
});

describe("Leaders", () => {
  it("are the Bowlers in first position", () => {
    const ranked = standings([bowler("ana", 9), bowler("bea", 30)]);

    expect(leaders(ranked)).toEqual([bowler("bea", 30)]);
  });

  it("are every Bowler tied for first", () => {
    const ranked = standings([
      bowler("ana", 30),
      bowler("bea", 12),
      bowler("eva", 30),
    ]);

    expect(leaders(ranked).map((b) => b.id)).toEqual(["ana", "eva"]);
  });
});
