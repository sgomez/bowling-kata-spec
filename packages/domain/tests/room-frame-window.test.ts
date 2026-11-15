import { describe, expect, it } from "vitest";
import { STRIKE, skipFrames, startedRoom, T0 } from "./started-room.js";

const CLOSES_AT = T0 + 30_500;

describe("closing a Frame Window", () => {
  it("waits until 500 ms after the deadline", () => {
    const room = startedRoom("bea");

    room.advance(CLOSES_AT - 1);

    expect(room.snapshot("ana", CLOSES_AT - 1).frame?.open).toBe(true);
  });

  it("counts every missing Roll as zero pins", () => {
    const room = startedRoom("bea");
    room.roll("ana", [1, 2, 3], T0);

    room.advance(CLOSES_AT);

    const [ana, bea] = room.snapshot("ana", CLOSES_AT).bowlers;
    expect(ana.frames[0]).toEqual({ rolls: ["3", "-"], score: 3 });
    expect(bea.frames[0]).toEqual({ rolls: ["-", "-"], score: 0 });
    expect(room.snapshot("ana", CLOSES_AT).standing).toEqual(STRIKE);
  });

  it("happens early once every connected Bowler has finished", () => {
    const room = startedRoom("bea", "carla");
    room.disconnect("carla", T0);
    room.roll("ana", STRIKE, T0);
    room.roll("bea", [1], T0 + 2_000);

    room.roll("bea", [2], T0 + 3_000);

    expect(room.snapshot("ana", T0 + 3_000).frame).toEqual({
      number: 1,
      open: false,
      remainingMs: 5_000,
    });
    expect(room.snapshot("ana", T0 + 3_000).bowlers[2]).toMatchObject({
      connected: false,
      frames: expect.arrayContaining([{ rolls: ["-", "-"], score: 0 }]),
    });
  });

  it("happens early when the last unfinished Bowler disconnects", () => {
    const room = startedRoom("bea");
    room.roll("ana", STRIKE, T0);

    room.disconnect("bea", T0 + 1_000);

    expect(room.snapshot("ana", T0 + 1_000).frame?.open).toBe(false);
  });

  it("does not happen early with nobody connected", () => {
    const room = startedRoom();

    room.disconnect("ana", T0);
    room.disconnect("nobody", T0);

    expect(room.snapshot("ana", T0).frame?.open).toBe(true);
  });
});

describe("after the reveal", () => {
  it("opens the next Frame Window 5 s later", () => {
    const room = startedRoom("bea");
    room.advance(CLOSES_AT);
    expect(room.nextDeadline()).toBe(CLOSES_AT + 5_000);

    room.advance(CLOSES_AT + 5_000);

    expect(room.snapshot("ana", CLOSES_AT + 5_000).frame).toEqual({
      number: 2,
      open: true,
      remainingMs: 30_000,
    });
  });
});

describe("after the Tenth Frame", () => {
  it("finishes the Room with the final Scores and the winner", () => {
    const room = startedRoom("bea");
    const now = skipFrames(room, 9);
    room.roll("bea", [1], now);

    room.advance(now + 45_500);

    const snapshot = room.snapshot("ana", now + 45_500);
    expect(snapshot.phase).toBe("finished");
    expect(snapshot.frame).toBeUndefined();
    expect(snapshot.bowlers.map((b) => b.total)).toEqual([0, 1]);
    expect(snapshot.winners).toEqual(["bea"]);
    expect(room.nextDeadline()).toBeUndefined();
    expect(room.roll("ana", [1], now)).toMatchObject({ ok: false });
  });

  it("allows a tie", () => {
    const room = startedRoom("bea");
    skipFrames(room, 9);
    room.advance(room.nextDeadline() as number);

    expect(room.snapshot("ana", 0).winners).toEqual(["ana", "bea"]);
  });
});

describe("advancing the clock", () => {
  it("does nothing in the Lobby or once finished", () => {
    const room = startedRoom();
    skipFrames(room, 10);

    room.advance(Number.MAX_SAFE_INTEGER);

    expect(room.snapshot("ana", 0).phase).toBe("finished");
  });
});
