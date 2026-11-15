import { describe, expect, it } from "vitest";
import { Room } from "../src/room.js";
import type { RoomCode } from "../src/room-code.js";
import { STRIKE, startedRoom, T0 } from "./started-room.js";

const refused = (type: string) => ({ ok: false, failure: { type } });

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

const ids = (room: Room) => room.snapshot("ana", T0).bowlers.map((b) => b.id);
const hostOf = (room: Room) => room.snapshot("ana", T0).hostId;

describe("a Bowler leaving", () => {
  it("drops the Bowler and their Game", () => {
    const room = startedRoom("bea", "carlos");
    room.roll("bea", [1], T0);

    expect(room.leave("bea", T0)).toEqual({ ok: true });

    expect(ids(room)).toEqual(["ana", "carlos"]);
  });

  it("frees their nickname in the Lobby", () => {
    const room = lobby("bea");
    room.leave("bea", T0);

    expect(room.join({ id: "bea2", nickname: "Bea" })).toEqual({ ok: true });
  });

  it("closes the window early when everyone left has finished", () => {
    const room = startedRoom("bea");
    room.roll("ana", STRIKE, T0);

    room.leave("bea", T0);

    expect(room.snapshot("ana", T0).frame?.open).toBe(false);
  });

  it("is refused for someone outside the Room", () => {
    expect(lobby().leave("nobody", T0)).toEqual(refused("NOT_IN_ROOM"));
  });

  it("empties the Room when the last Bowler goes", () => {
    const room = lobby();

    room.leave("ana", T0);

    expect(room.lifecycle().bowlerCount).toBe(0);
  });
});

describe("the Host removing a Bowler", () => {
  it("drops the Bowler and their Game", () => {
    const room = startedRoom("bea");

    expect(room.remove("ana", "bea", T0)).toEqual({ ok: true });

    expect(ids(room)).toEqual(["ana"]);
    expect(room.lifecycle().bowlerCount).toBe(1);
  });

  it("is refused to anyone but the Host", () => {
    const room = lobby("bea", "carlos");

    expect(room.remove("bea", "carlos", T0)).toEqual(refused("NOT_HOST"));
    expect(ids(room)).toEqual(["ana", "bea", "carlos"]);
  });

  it("is refused for someone outside the Room", () => {
    expect(lobby().remove("ana", "nobody", T0)).toEqual(refused("NOT_IN_ROOM"));
  });
});

describe("Host transfer", () => {
  it("passes to the next connected Bowler in join order when the Host leaves", () => {
    const room = lobby("bea", "carlos");
    room.disconnect("bea", T0);

    room.leave("ana", T0);

    expect(hostOf(room)).toBe("carlos");
  });

  it("follows the Host's place in the join order, wrapping around", () => {
    const room = lobby("bea", "carlos", "dani");
    room.disconnect("ana", T0);
    room.reconnect("ana");

    room.leave("bea", T0);
    expect(hostOf(room)).toBe("carlos");

    room.disconnect("dani", T0);
    room.leave("carlos", T0);
    expect(hostOf(room)).toBe("ana");
  });

  it("passes to the next connected Bowler when the Host is removed by themselves", () => {
    const room = lobby("bea");

    room.remove("ana", "ana", T0);

    expect(hostOf(room)).toBe("bea");
  });

  it("passes to the next Bowler even if disconnected when nobody else is connected", () => {
    const room = lobby("bea");
    room.disconnect("bea", T0);

    room.leave("ana", T0);

    expect(hostOf(room)).toBe("bea");
  });

  it("passes to the next connected Bowler when the Host disconnects", () => {
    const room = lobby("bea", "carlos");

    room.disconnect("ana", T0);

    expect(hostOf(room)).toBe("bea");
  });

  it("stays with a disconnected Host when nobody is connected", () => {
    const room = lobby("bea");
    room.disconnect("bea", T0);

    room.disconnect("ana", T0);

    expect(hostOf(room)).toBe("ana");
  });

  it("stays when another Bowler leaves", () => {
    const room = lobby("bea");

    room.leave("bea", T0);

    expect(hostOf(room)).toBe("ana");
  });
});

describe("a Bowler reconnecting", () => {
  it("is shown as connected again with their standing Pins", () => {
    const room = startedRoom("bea");
    room.roll("bea", [1, 2, 3], T0);
    room.disconnect("bea", T0);

    expect(room.reconnect("bea")).toEqual({ ok: true });

    const snapshot = room.snapshot("bea", T0);
    expect(snapshot.bowlers[1].connected).toBe(true);
    expect(snapshot.standing).toEqual([4, 5, 6, 7, 8, 9, 10]);
  });

  it("becomes Host when the Host is disconnected", () => {
    const room = lobby("bea");
    room.disconnect("bea", T0);
    room.disconnect("ana", T0);

    room.reconnect("bea");

    expect(hostOf(room)).toBe("bea");
  });

  it("is refused for someone outside the Room", () => {
    expect(lobby().reconnect("nobody")).toEqual(refused("NOT_IN_ROOM"));
  });
});
