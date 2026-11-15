import { describe, expect, it } from "vitest";
import { Room } from "../src/room.js";
import { parseRoomCode, type RoomCode } from "../src/room-code.js";

const CODE = parseRoomCode("K7MPQ") as RoomCode;

const createRoom = (nickname = "Ana") => {
  const result = Room.create(CODE, { id: "ana", nickname });
  if (!result.ok) {
    throw new Error(result.failure.type);
  }
  return result.room;
};

describe("creating a Room", () => {
  it("opens its Lobby with the creator as Host and only Bowler", () => {
    const room = createRoom();

    expect(room.snapshot()).toEqual({
      code: "K7MPQ",
      phase: "lobby",
      hostId: "ana",
      bowlers: [{ id: "ana", nickname: "Ana" }],
    });
  });

  it("refuses an invalid nickname", () => {
    expect(Room.create(CODE, { id: "ana", nickname: "  " })).toEqual({
      ok: false,
      failure: { type: "NICKNAME_INVALID" },
    });
  });
});

describe("joining a Room's Lobby", () => {
  it("lists Bowlers in join order with trimmed nicknames", () => {
    const room = createRoom();

    expect(room.join({ id: "bea", nickname: "  Bea " })).toEqual({ ok: true });
    expect(room.join({ id: "carlos", nickname: "Carlos" })).toEqual({
      ok: true,
    });

    expect(room.snapshot().bowlers).toEqual([
      { id: "ana", nickname: "Ana" },
      { id: "bea", nickname: "Bea" },
      { id: "carlos", nickname: "Carlos" },
    ]);
    expect(room.snapshot().hostId).toBe("ana");
  });

  it("accepts nicknames of 1 to 16 characters", () => {
    const room = createRoom();

    expect(room.join({ id: "b", nickname: "B" })).toEqual({ ok: true });
    expect(room.join({ id: "c", nickname: "C".repeat(16) })).toEqual({
      ok: true,
    });
  });

  it.each(["", "   ", "D".repeat(17)])(
    "refuses the nickname %j",
    (nickname) => {
      const room = createRoom();

      expect(room.join({ id: "d", nickname })).toEqual({
        ok: false,
        failure: { type: "NICKNAME_INVALID" },
      });
    },
  );

  it("refuses a nickname already taken, ignoring case and spaces", () => {
    const room = createRoom();

    expect(room.join({ id: "ana2", nickname: " aNA " })).toEqual({
      ok: false,
      failure: { type: "NICKNAME_TAKEN" },
    });
    expect(room.snapshot().bowlers).toHaveLength(1);
  });

  it("refuses a seventh Bowler", () => {
    const room = createRoom();
    for (const name of ["Bea", "Carlos", "Dani", "Eva", "Fer"]) {
      expect(room.join({ id: name, nickname: name })).toEqual({ ok: true });
    }

    expect(room.join({ id: "gema", nickname: "Gema" })).toEqual({
      ok: false,
      failure: { type: "ROOM_FULL" },
    });
    expect(room.snapshot().bowlers).toHaveLength(6);
  });
});

describe("leaving the Lobby", () => {
  it("is the Host's decision", () => {
    const room = createRoom();
    room.join({ id: "bea", nickname: "Bea" });

    expect(room.start("bea")).toEqual({
      ok: false,
      failure: { type: "NOT_HOST" },
    });
    expect(room.snapshot().phase).toBe("lobby");
  });

  it("starts the Games, even with the Host alone", () => {
    const room = createRoom();

    expect(room.start("ana")).toEqual({ ok: true });
    expect(room.snapshot().phase).toBe("playing");
  });

  it("closes the Room to new Bowlers", () => {
    const room = createRoom();
    room.start("ana");

    expect(room.join({ id: "bea", nickname: "Bea" })).toEqual({
      ok: false,
      failure: { type: "GAMES_STARTED" },
    });
  });

  it("happens only once", () => {
    const room = createRoom();
    room.start("ana");

    expect(room.start("ana")).toEqual({
      ok: false,
      failure: { type: "GAMES_STARTED" },
    });
  });
});
