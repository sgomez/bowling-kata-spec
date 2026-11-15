import { randomUUID } from "node:crypto";
import type { Server } from "node:http";
import {
  type BowlerId,
  type ClientMessage,
  type ErrorCode,
  generateRoomCode,
  parseClientMessage,
  parseRoomCode,
  Room,
  type RoomCode,
} from "@bowling/domain";
import { WebSocketServer } from "ws";
import type { Clock } from "./clock.js";
import { addressOf, createAddressBook, createMessageGate } from "./guard.js";
import type { Limits } from "./limits.js";
import { RoomEntry, send, sendClosed } from "./room-entry.js";

interface Seat {
  entry: RoomEntry;
  bowlerId: BowlerId;
}

type SeatedMessage = Extract<
  ClientMessage,
  { type: "start" | "roll" | "rematch" }
>;

const isSeated = (message: ClientMessage): message is SeatedMessage =>
  message.type === "start" ||
  message.type === "roll" ||
  message.type === "rematch";

const act = (
  { entry, bowlerId }: Seat,
  message: SeatedMessage,
  now: number,
) => {
  switch (message.type) {
    case "start":
      return entry.room.start(bowlerId, now);
    case "rematch":
      return entry.room.rematch(bowlerId, now);
    case "roll":
      return entry.room.roll(bowlerId, message.pins, now);
  }
};

export const attachRoomSocket = (
  server: Server,
  random: () => number,
  clock: Clock,
  limits: Limits,
) => {
  const rooms = new Map<RoomCode, RoomEntry>();
  const addresses = createAddressBook(limits.connectionsPerAddress);
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 4 * limits.messageBytes,
  });
  server.on("close", () => {
    for (const entry of rooms.values()) {
      entry.dispose();
    }
    wss.close();
  });

  wss.on("connection", (socket, request) => {
    const fail = (error: ErrorCode) => send(socket, { type: "error", error });
    const address = addressOf(request);
    if (!addresses.admit(address)) {
      fail("TOO_MANY_CONNECTIONS");
      socket.close(1008);
      return;
    }
    const gate = createMessageGate(limits, clock);
    let seat: Seat | undefined;

    const sit = (entry: RoomEntry, bowlerId: BowlerId) => {
      seat = { entry, bowlerId };
      entry.sockets.set(bowlerId, socket);
      entry.changed();
    };

    const handle = (message: ClientMessage) => {
      if (isSeated(message)) {
        if (!seat) {
          return fail("NOT_IN_ROOM");
        }
        const result = act(seat, message, clock.now());
        return result.ok ? seat.entry.changed() : fail(result.failure.type);
      }
      if (seat) {
        return fail("ALREADY_IN_ROOM");
      }
      const bowler = { id: randomUUID(), nickname: message.nickname };
      if (message.type === "create") {
        if (rooms.size >= limits.rooms) {
          return fail("TOO_MANY_ROOMS");
        }
        const code = generateRoomCode((c) => rooms.has(c), random);
        const created = Room.create(code, bowler);
        if (!created.ok) {
          return fail(created.failure.type);
        }
        const entry = new RoomEntry(created.room, clock, limits, () =>
          rooms.delete(code),
        );
        rooms.set(code, entry);
        return sit(entry, bowler.id);
      }
      const code = parseRoomCode(message.code);
      const entry = code && rooms.get(code);
      if (!entry) {
        return fail("UNKNOWN_ROOM");
      }
      const joined = entry.room.join(bowler);
      return joined.ok ? sit(entry, bowler.id) : fail(joined.failure.type);
    };

    socket.on("message", (data) => {
      const raw = String(data);
      const refusal = gate(Buffer.byteLength(raw));
      const message = refusal ? undefined : parseClientMessage(raw);
      if (message) {
        handle(message);
      } else {
        fail(refusal ?? "INVALID_MESSAGE");
      }
    });

    socket.on("close", () => {
      addresses.release(address);
      if (seat) {
        seat.entry.sockets.delete(seat.bowlerId);
        seat.entry.room.disconnect(seat.bowlerId, clock.now());
        seat.entry.changed();
      }
    });
  });

  return {
    usage: () => ({
      rooms: rooms.size,
      connections: wss.clients.size,
      addresses: addresses.size,
    }),
    shutdown: () => {
      for (const entry of rooms.values()) {
        entry.close("SERVER_SHUTDOWN");
      }
      for (const socket of wss.clients) {
        if (socket.readyState === socket.OPEN) {
          sendClosed(socket, "SERVER_SHUTDOWN");
        }
      }
    },
  };
};
