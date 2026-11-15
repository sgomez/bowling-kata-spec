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
  type RoomResult,
} from "@bowling/domain";
import { WebSocketServer } from "ws";
import type { Clock } from "./clock.js";
import { addressOf, createAddressBook, createMessageGate } from "./guard.js";
import type { Limits } from "./limits.js";
import { RoomEntry, send, sendClosed } from "./room-entry.js";
import { act, createSeats, isSeated } from "./seated.js";

export const attachRoomSocket = (
  server: Server,
  random: () => number,
  clock: Clock,
  limits: Limits,
) => {
  const rooms = new Map<RoomCode, RoomEntry>();
  const seats = createSeats();
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
    const failed = (result: RoomResult) => {
      if (!result.ok) {
        fail(result.failure.type);
      }
      return !result.ok;
    };

    const seatNew = (entry: RoomEntry, bowlerId: BowlerId) => {
      entry.tokens.set(bowlerId, `${entry.room.code}.${randomUUID()}`);
      seats.sit(socket, entry, bowlerId);
    };

    const resume = (token: string) => {
      const code = parseRoomCode(token.split(".")[0] ?? "");
      const entry = code ? rooms.get(code) : undefined;
      const bowlerId = entry?.bowlerWith(token);
      if (!entry || !bowlerId) {
        return fail("UNKNOWN_SESSION");
      }
      entry.room.reconnect(bowlerId);
      seats.sit(socket, entry, bowlerId);
    };

    const handle = (message: ClientMessage) => {
      const seat = seats.get(socket);
      if (isSeated(message)) {
        if (!seat) {
          return fail("NOT_IN_ROOM");
        }
        return (
          failed(act(seat, message, clock.now())) ||
          seats.afterSeated(seat, message)
        );
      }
      if (seat) {
        return fail("ALREADY_IN_ROOM");
      }
      if (message.type === "resume") {
        return resume(message.token);
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
        return seatNew(entry, bowler.id);
      }
      const code = parseRoomCode(message.code);
      const entry = code && rooms.get(code);
      if (!entry) {
        return fail("UNKNOWN_ROOM");
      }
      return failed(entry.room.join(bowler)) || seatNew(entry, bowler.id);
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
      const seat = seats.get(socket);
      addresses.release(address);
      if (seat) {
        seats.release(socket);
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
