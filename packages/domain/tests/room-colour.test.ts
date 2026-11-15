import { describe, expect, it } from "vitest";
import { Room } from "../src/room.js";
import type { RoomCode } from "../src/room-code.js";
import { STRIKE, T0 } from "./started-room.js";

const lobby = (...others: string[]) => {
  const created = Room.create("K7MPQ" as RoomCode, {
    id: "ana",
    nickname: "Ana",
  });
  if (!created.ok) {
    throw new Error(created.failure.type);
  }
  for (const id of others) {
    created.room.join({ id, nickname: id });
  }
  return created.room;
};

const colours = (room: Room, now = T0) =>
  Object.fromEntries(
    room.snapshot("ana", now).bowlers.map((b) => [b.id, b.colour]),
  );

describe("the Bowler Colour", () => {
  it("is the lowest index not held in the Room, in joining order", () => {
    const room = lobby("bea", "carlos", "dani", "eva", "fran");

    expect(colours(room)).toEqual({
      ana: 0,
      bea: 1,
      carlos: 2,
      dani: 3,
      eva: 4,
      fran: 5,
    });
  });

  it("is kept when others leave", () => {
    const room = lobby("bea", "carlos");

    room.leave("bea", T0);

    expect(colours(room)).toEqual({ ana: 0, carlos: 2 });
  });

  it("is freed on leaving and taken by the next Bowler to join", () => {
    const room = lobby("bea", "carlos");
    room.leave("bea", T0);

    room.join({ id: "dani", nickname: "dani" });

    expect(colours(room)).toEqual({ ana: 0, carlos: 2, dani: 1 });
  });

  it("is freed when the Host removes the Bowler", () => {
    const room = lobby("bea", "carlos");
    room.remove("ana", "bea", T0);

    room.join({ id: "dani", nickname: "dani" });

    expect(colours(room)).toEqual({ ana: 0, carlos: 2, dani: 1 });
  });

  it("is kept through a Rematch", () => {
    const room = lobby("bea", "carlos");
    room.leave("bea", T0);
    room.start("ana", T0);
    room.roll("ana", STRIKE, T0);
    let now = T0;
    for (
      let at = room.nextDeadline();
      at !== undefined;
      at = room.nextDeadline()
    ) {
      now = at;
      room.advance(now);
    }

    room.rematch("ana", now);

    expect(colours(room, now)).toEqual({ ana: 0, carlos: 2 });
  });
});
