import type { RoomSnapshot } from "@bowling/domain";
import { describe, expect, it } from "vitest";
import { createSession } from "../src/session.js";
import { FakeSocket } from "./fake-socket.js";

const ROOM = {
  code: "K7MPQ",
  phase: "lobby",
  hostId: "ana",
  bowlers: [{ id: "ana", nickname: "Ana" }],
} as RoomSnapshot;

const setup = () => {
  const sockets: FakeSocket[] = [];
  const session = createSession(
    () => {
      const socket = new FakeSocket();
      sockets.push(socket);
      return socket;
    },
    () => 42,
  );
  return { session, sockets };
};

describe("session", () => {
  it("connects on the first request and sends it once open", () => {
    const { session, sockets } = setup();

    session.create("Ana");
    expect(sockets).toHaveLength(1);
    expect(sockets[0].sent).toEqual([]);

    sockets[0].open();
    expect(sockets[0].sent).toEqual([{ type: "create", nickname: "Ana" }]);
  });

  it("reuses the open connection", () => {
    const { session, sockets } = setup();
    session.join("k7mpq", "Bea");
    sockets[0].open();

    session.start();
    session.roll([1, 5]);
    session.rematch();

    expect(sockets).toHaveLength(1);
    expect(sockets[0].sent).toEqual([
      { type: "join", code: "k7mpq", nickname: "Bea" },
      { type: "start" },
      { type: "roll", pins: [1, 5] },
      { type: "rematch" },
    ]);
  });

  it("keeps the latest Room snapshot and clears any error", () => {
    const { session, sockets } = setup();
    session.create("Ana");
    sockets[0].open();

    sockets[0].receive({ type: "error", error: "NICKNAME_INVALID" });
    expect(session.error.value).toBe("NICKNAME_INVALID");

    sockets[0].receive({ type: "room", you: "ana", token: "t", room: ROOM });
    expect(session.seat.value).toEqual({
      you: "ana",
      room: ROOM,
      receivedAt: 42,
    });
    expect(session.error.value).toBeUndefined();
  });

  it("leaves the Room when the server closes it", () => {
    const { session, sockets } = setup();
    session.create("Ana");
    sockets[0].open();
    sockets[0].receive({ type: "room", you: "ana", token: "t", room: ROOM });
    sockets[0].receive({ type: "error", error: "NOT_HOST" });

    sockets[0].receive({ type: "closed", reason: "ROOM_CLOSED" });

    expect(session.seat.value).toBeUndefined();
    expect(session.error.value).toBeUndefined();
    expect(session.closed.value).toBe("ROOM_CLOSED");
  });

  it.each([
    ["in a new Room", { type: "room", you: "ana", token: "t", room: ROOM }],
    ["on a refusal", { type: "error", error: "TOO_MANY_ROOMS" }],
  ] as const)("forgets the closing notice %s", (_, next) => {
    const { session, sockets } = setup();
    session.create("Ana");
    sockets[0].open();
    sockets[0].receive({ type: "closed", reason: "SERVER_SHUTDOWN" });

    sockets[0].receive(next);

    expect(session.closed.value).toBeUndefined();
  });

  it("reconnects for the next request after the connection drops", () => {
    const { session, sockets } = setup();
    session.create("Ana");
    sockets[0].open();
    sockets[0].drop();

    session.create("Ana");

    expect(sockets).toHaveLength(2);
  });
});
