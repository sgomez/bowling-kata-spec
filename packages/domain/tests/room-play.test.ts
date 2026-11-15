import { describe, expect, it } from "vitest";
import { Room } from "../src/room.js";
import type { RoomCode } from "../src/room-code.js";
import { STRIKE, skipFrames, startedRoom, T0 } from "./started-room.js";

const CODE = "K7MPQ" as RoomCode;

const refused = (type: string) => ({ ok: false, failure: { type } });

describe("starting the Games", () => {
  it("opens the first Frame Window for 30 s", () => {
    const room = startedRoom();

    expect(room.snapshot("ana", T0 + 1_000).frame).toEqual({
      number: 1,
      open: true,
      remainingMs: 29_000,
    });
    expect(room.nextDeadline()).toBe(T0 + 30_500);
  });

  it("gives every Bowler a full rack and an empty scorecard", () => {
    const snapshot = startedRoom("bea").snapshot("ana", T0);

    expect(snapshot.standing).toEqual(STRIKE);
    expect(snapshot.bowlers[1]).toMatchObject({
      nickname: "bea",
      connected: true,
      finishedFrame: false,
      total: 0,
    });
    expect(snapshot.bowlers[1].frames[0]).toEqual({ rolls: [], score: null });
  });
});

describe("a Roll", () => {
  it("knocks the given Pins and leaves the rest standing", () => {
    const room = startedRoom("bea");

    expect(room.roll("ana", [1, 2, 4, 7], T0)).toEqual({ ok: true });

    const snapshot = room.snapshot("ana", T0);
    expect(snapshot.standing).toEqual([3, 5, 6, 8, 9, 10]);
    expect(snapshot.bowlers[0].frames[0].rolls).toEqual(["4"]);
  });

  it("may knock no Pins at all", () => {
    const room = startedRoom("bea");

    expect(room.roll("ana", [], T0)).toEqual({ ok: true });
    expect(room.snapshot("ana", T0).bowlers[0].frames[0].rolls).toEqual(["-"]);
  });

  it("is refused for a Pin already knocked", () => {
    const room = startedRoom("bea");
    room.roll("ana", [1, 2], T0);

    expect(room.roll("ana", [2, 3], T0)).toEqual(refused("PIN_NOT_STANDING"));
    expect(room.snapshot("ana", T0).standing).toHaveLength(8);
  });

  it("is refused once the Bowler has finished the Frame", () => {
    const room = startedRoom("bea");
    room.roll("ana", STRIKE, T0);

    expect(room.roll("ana", [1], T0)).toEqual(refused("FRAME_FINISHED"));
  });

  it("is refused before the Games start", () => {
    const created = Room.create(CODE, { id: "ana", nickname: "Ana" });

    expect(created.ok && created.room.roll("ana", [1], T0)).toEqual(
      refused("WINDOW_CLOSED"),
    );
  });

  it("is refused for someone outside the Room", () => {
    expect(startedRoom().roll("nobody", [1], T0)).toEqual(
      refused("NOT_IN_ROOM"),
    );
  });

  it("still counts up to 500 ms after the deadline", () => {
    const room = startedRoom("bea");

    expect(room.roll("ana", [1], T0 + 30_500)).toEqual({ ok: true });
    expect(room.roll("ana", [2], T0 + 30_501)).toEqual(
      refused("WINDOW_CLOSED"),
    );
  });

  it("is refused while the scorecard is revealed", () => {
    const room = startedRoom("bea");
    room.advance(T0 + 30_500);

    expect(room.roll("ana", [1], T0 + 31_000)).toEqual(
      refused("WINDOW_CLOSED"),
    );
  });

  it("starts a fresh rack after a Strike in the Tenth Frame", () => {
    const room = startedRoom("bea");
    const now = skipFrames(room, 9);
    room.roll("ana", STRIKE, now);

    expect(room.snapshot("ana", now).standing).toEqual(STRIKE);
    expect(room.snapshot("ana", now).frame?.remainingMs).toBe(45_000);
  });
});

describe("while a Frame Window is open", () => {
  it("shows who has finished but not their Rolls", () => {
    const room = startedRoom("bea");
    room.roll("bea", [1, 2, 3], T0);
    room.roll("bea", [4, 5], T0);

    const bea = room.snapshot("ana", T0).bowlers[1];
    expect(bea.finishedFrame).toBe(true);
    expect(bea.frames[0]).toEqual({ rolls: [], score: null });
    expect(room.snapshot("bea", T0).bowlers[1].frames[0]).toEqual({
      rolls: ["3", "2"],
      score: 5,
    });
  });

  it("hides the bonus a Roll adds to an earlier Frame", () => {
    const room = startedRoom("bea");
    room.roll("bea", STRIKE, T0);
    const now = skipFrames(room, 1);
    room.roll("bea", [1, 2], now);
    room.roll("bea", [3], now);

    const bea = room.snapshot("ana", now).bowlers[1];
    expect(bea.frames[0]).toEqual({ rolls: ["X"], score: null });
    expect(bea.total).toBe(0);
    expect(room.snapshot("bea", now).bowlers[1].total).toBe(16);
  });
});

describe("a snapshot for someone outside the Room", () => {
  it("shows no standing Pins", () => {
    expect(startedRoom().snapshot("nobody", T0).standing).toEqual([]);
  });
});
