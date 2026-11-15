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
import { type WebSocket, WebSocketServer } from "ws";
import type { Clock } from "./clock.js";
import { RoomEntry, send } from "./room-entry.js";
import { act, isSeated, type Seat, type SeatedMessage } from "./seated.js";

export const attachRoomSocket = (
  server: Server,
  random: () => number,
  clock: Clock,
) => {
  const rooms = new Map<RoomCode, RoomEntry>();
  const seats = new WeakMap<WebSocket, Seat>();
  const wss = new WebSocketServer({ server, path: "/ws" });
  server.on("close", () => {
    for (const entry of rooms.values()) {
      entry.dispose();
    }
    wss.close();
  });

  const unseat = (entry: RoomEntry, bowlerId: BowlerId) => {
    const socket = entry.sockets.get(bowlerId);
    if (socket) {
      seats.delete(socket);
    }
    entry.sockets.delete(bowlerId);
    entry.tokens.delete(bowlerId);
    return socket;
  };

  const settle = (entry: RoomEntry) => {
    if (entry.room.isEmpty()) {
      entry.dispose();
      rooms.delete(entry.room.code);
    } else {
      entry.changed();
    }
  };

  const afterSeated = (seat: Seat, message: SeatedMessage) => {
    if (message.type === "leave") {
      unseat(seat.entry, seat.bowlerId);
    }
    if (message.type === "remove") {
      const removed = unseat(seat.entry, message.bowlerId);
      if (removed) {
        send(removed, { type: "removed" });
      }
    }
    settle(seat.entry);
  };

  wss.on("connection", (socket) => {
    const fail = (error: ErrorCode) => send(socket, { type: "error", error });
    const failed = (result: RoomResult) => {
      if (!result.ok) {
        fail(result.failure.type);
      }
      return !result.ok;
    };

    const sit = (entry: RoomEntry, bowlerId: BowlerId) => {
      const previous = entry.sockets.get(bowlerId);
      if (previous) {
        seats.delete(previous);
        previous.close();
      }
      seats.set(socket, { entry, bowlerId });
      entry.sockets.set(bowlerId, socket);
      entry.changed();
    };

    const seatNew = (entry: RoomEntry, bowlerId: BowlerId) => {
      entry.tokens.set(bowlerId, `${entry.room.code}.${randomUUID()}`);
      sit(entry, bowlerId);
    };

    const resume = (token: string) => {
      const code = parseRoomCode(token.split(".")[0] ?? "");
      const entry = code ? rooms.get(code) : undefined;
      const bowlerId = entry?.bowlerWith(token);
      if (!entry || !bowlerId) {
        return fail("UNKNOWN_SESSION");
      }
      entry.room.reconnect(bowlerId);
      sit(entry, bowlerId);
    };

    const handle = (message: ClientMessage) => {
      const seat = seats.get(socket);
      if (isSeated(message)) {
        if (!seat) {
          return fail("NOT_IN_ROOM");
        }
        return (
          failed(act(seat, message, clock.now())) || afterSeated(seat, message)
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
        const code = generateRoomCode((c) => rooms.has(c), random);
        const created = Room.create(code, bowler);
        if (!created.ok) {
          return fail(created.failure.type);
        }
        const entry = new RoomEntry(created.room, clock);
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
      const message = parseClientMessage(String(data));
      if (message) {
        handle(message);
      } else {
        fail("INVALID_MESSAGE");
      }
    });

    socket.on("close", () => {
      const seat = seats.get(socket);
      if (seat) {
        seats.delete(socket);
        seat.entry.sockets.delete(seat.bowlerId);
        seat.entry.room.disconnect(seat.bowlerId, clock.now());
        seat.entry.changed();
      }
    });
  });
};
