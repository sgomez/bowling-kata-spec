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
import { RoomEntry, send } from "./room-entry.js";

interface Seat {
  entry: RoomEntry;
  bowlerId: BowlerId;
}

type SeatedMessage = Extract<ClientMessage, { type: "start" | "roll" }>;

const act = ({ entry, bowlerId }: Seat, message: SeatedMessage, now: number) =>
  message.type === "start"
    ? entry.room.start(bowlerId, now)
    : entry.room.roll(bowlerId, message.pins, now);

export const attachRoomSocket = (
  server: Server,
  random: () => number,
  clock: Clock,
) => {
  const rooms = new Map<RoomCode, RoomEntry>();
  const wss = new WebSocketServer({ server, path: "/ws" });
  server.on("close", () => {
    for (const entry of rooms.values()) {
      entry.dispose();
    }
    wss.close();
  });

  wss.on("connection", (socket) => {
    let seat: Seat | undefined;
    const fail = (error: ErrorCode) => send(socket, { type: "error", error });

    const sit = (entry: RoomEntry, bowlerId: BowlerId) => {
      seat = { entry, bowlerId };
      entry.sockets.set(bowlerId, socket);
      entry.changed();
    };

    const handle = (message: ClientMessage) => {
      if (message.type === "start" || message.type === "roll") {
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
        const code = generateRoomCode((c) => rooms.has(c), random);
        const created = Room.create(code, bowler);
        if (!created.ok) {
          return fail(created.failure.type);
        }
        const entry = new RoomEntry(created.room, clock);
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
      const message = parseClientMessage(String(data));
      if (message) {
        handle(message);
      } else {
        fail("INVALID_MESSAGE");
      }
    });

    socket.on("close", () => {
      if (seat) {
        seat.entry.sockets.delete(seat.bowlerId);
        seat.entry.room.disconnect(seat.bowlerId, clock.now());
        seat.entry.changed();
      }
    });
  });
};
