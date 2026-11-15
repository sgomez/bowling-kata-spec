import { describe, expect, it } from "vitest";
import type { Room } from "../src/room.js";
import { STRIKE, startedRoom, T0 } from "./started-room.js";

const refused = (type: string) => ({ ok: false, failure: { type } });

const finish = (room: Room) => {
  let now = T0;
  for (
    let at = room.nextDeadline();
    at !== undefined;
    at = room.nextDeadline()
  ) {
    now = at;
    room.advance(now);
  }
  return now;
};

describe("a Rematch", () => {
  it("gives every Bowler a new Game and opens Frame 1's window", () => {
    const room = startedRoom("bea");
    room.roll("ana", STRIKE, T0);
    const end = finish(room);

    expect(room.rematch("ana", end)).toEqual({ ok: true });

    const snapshot = room.snapshot("bea", end);
    expect(snapshot.phase).toBe("playing");
    expect(snapshot.frame).toEqual({
      number: 1,
      open: true,
      remainingMs: 30_000,
    });
    expect(snapshot.standing).toEqual(STRIKE);
    expect(snapshot.winners).toEqual([]);
    expect(snapshot.bowlers.map((b) => b.total)).toEqual([0, 0]);
    expect(room.nextDeadline()).toBe(end + 30_500);
  });

  it("is refused to anyone but the Host", () => {
    const room = startedRoom("bea");
    const end = finish(room);

    expect(room.rematch("bea", end)).toEqual(refused("NOT_HOST"));
    expect(room.snapshot("ana", end).phase).toBe("finished");
  });

  it("is refused until the Games have finished", () => {
    const room = startedRoom("bea");

    expect(room.rematch("ana", T0)).toEqual(refused("GAMES_NOT_FINISHED"));
  });
});
