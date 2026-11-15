import type { RoomSnapshot } from "@bowling/domain";
import { describe, expect, it } from "vitest";
import { createConnection } from "../src/connection.js";
import { FakeSocket } from "./fake-socket.js";

const ROOM = {
  code: "K7MPQ",
  phase: "lobby",
  hostId: "ana",
  bowlers: [{ id: "ana", nickname: "Ana" }],
} as RoomSnapshot;

const setup = () => {
  const sockets: FakeSocket[] = [];
  const connection = createConnection(
    () => {
      const socket = new FakeSocket();
      sockets.push(socket);
      return socket;
    },
    () => 42,
  );
  return { connection, sockets };
};

describe("connection", () => {
  it("connects on the first request and sends it once open", () => {
    const { connection, sockets } = setup();

    connection.create("Ana");
    expect(sockets).toHaveLength(1);
    expect(sockets[0].sent).toEqual([]);

    sockets[0].open();
    expect(sockets[0].sent).toEqual([{ type: "create", nickname: "Ana" }]);
  });

  it("reuses the open connection", () => {
    const { connection, sockets } = setup();
    connection.join("k7mpq", "Bea");
    sockets[0].open();

    connection.start();
    connection.roll([1, 5]);
    connection.roll([], true);
    connection.rematch();

    expect(sockets).toHaveLength(1);
    expect(sockets[0].sent).toEqual([
      { type: "join", code: "k7mpq", nickname: "Bea" },
      { type: "start" },
      { type: "roll", pins: [1, 5] },
      { type: "roll", pins: [], foul: true },
      { type: "rematch" },
    ]);
  });

  it("keeps the latest Room snapshot and clears any error", () => {
    const { connection, sockets } = setup();
    connection.create("Ana");
    sockets[0].open();

    sockets[0].receive({ type: "error", error: "NICKNAME_INVALID" });
    expect(connection.error.value).toBe("NICKNAME_INVALID");

    sockets[0].receive({ type: "room", you: "ana", token: "t", room: ROOM });
    expect(connection.seat.value).toEqual({
      you: "ana",
      room: ROOM,
      receivedAt: 42,
    });
    expect(connection.error.value).toBeUndefined();
  });

  it("remembers the Frame whose Roll the Frame Window cut short", () => {
    const { connection, sockets } = setup();
    connection.create("Ana");
    sockets[0].open();
    const frame = { number: 3, open: true, remainingMs: 0 } as const;
    const room = { ...ROOM, phase: "playing", frame } as RoomSnapshot;
    sockets[0].receive({ type: "room", you: "ana", token: "t", room });

    connection.miss();

    expect(connection.missed.value).toBe(3);
    expect(sockets[0].sent).toHaveLength(1);
    const next = { ...room, frame: { ...frame, number: 4 } } as RoomSnapshot;
    sockets[0].receive({ type: "room", you: "ana", token: "t", room: next });
    expect(connection.missed.value).toBeUndefined();
  });

  it("leaves the Room when the server closes it", () => {
    const { connection, sockets } = setup();
    connection.create("Ana");
    sockets[0].open();
    sockets[0].receive({ type: "room", you: "ana", token: "t", room: ROOM });
    sockets[0].receive({ type: "error", error: "NOT_HOST" });

    sockets[0].receive({ type: "closed", reason: "ROOM_CLOSED" });

    expect(connection.seat.value).toBeUndefined();
    expect(connection.error.value).toBeUndefined();
    expect(connection.closed.value).toBe("ROOM_CLOSED");
  });

  it.each([
    ["in a new Room", { type: "room", you: "ana", token: "t", room: ROOM }],
    ["on a refusal", { type: "error", error: "TOO_MANY_ROOMS" }],
  ] as const)("forgets the closing notice %s", (_, next) => {
    const { connection, sockets } = setup();
    connection.create("Ana");
    sockets[0].open();
    sockets[0].receive({ type: "closed", reason: "SERVER_SHUTDOWN" });

    sockets[0].receive(next);

    expect(connection.closed.value).toBeUndefined();
  });

  it.each([
    ["created", { type: "room", you: "ana", token: "t", room: ROOM }],
    ["refused", { type: "error", error: "ROOM_FULL" }],
  ] as const)("waits on entering a Room until it is %s", (_, reply) => {
    const { connection, sockets } = setup();

    connection.join("K7MPQ", "Bea");
    expect(connection.entering.value).toBe("join");

    sockets[0].open();
    sockets[0].receive(reply);
    expect(connection.entering.value).toBeUndefined();
  });

  it("stops waiting when the connection drops before an answer", () => {
    const { connection, sockets } = setup();
    connection.create("Ana");
    expect(connection.entering.value).toBe("create");

    sockets[0].drop();

    expect(connection.entering.value).toBeUndefined();
  });

  it("reconnects for the next request after the connection drops", () => {
    const { connection, sockets } = setup();
    connection.create("Ana");
    sockets[0].open();
    sockets[0].drop();

    connection.create("Ana");

    expect(sockets).toHaveLength(2);
  });
});
