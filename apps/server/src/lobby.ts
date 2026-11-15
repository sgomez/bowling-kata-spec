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
  type ServerMessage,
} from "@bowling/domain";
import { type WebSocket, WebSocketServer } from "ws";

interface Entry {
  room: Room;
  sockets: Map<BowlerId, WebSocket>;
}

interface Seat {
  entry: Entry;
  bowlerId: BowlerId;
}

const send = (socket: WebSocket, message: ServerMessage) =>
  socket.send(JSON.stringify(message));

const broadcast = ({ room, sockets }: Entry) => {
  const snapshot = room.snapshot();
  for (const [you, socket] of sockets) {
    send(socket, { type: "room", you, room: snapshot });
  }
};

export const attachLobby = (server: Server, random: () => number) => {
  const rooms = new Map<RoomCode, Entry>();
  const wss = new WebSocketServer({ server, path: "/ws" });
  server.on("close", () => wss.close());

  wss.on("connection", (socket) => {
    let seat: Seat | undefined;
    const fail = (error: ErrorCode) => send(socket, { type: "error", error });

    const sit = (entry: Entry, bowlerId: BowlerId) => {
      seat = { entry, bowlerId };
      entry.sockets.set(bowlerId, socket);
      broadcast(entry);
    };

    const handle = (message: ClientMessage) => {
      if (message.type === "start") {
        if (!seat) {
          return fail("NOT_IN_ROOM");
        }
        const result = seat.entry.room.start(seat.bowlerId);
        return result.ok ? broadcast(seat.entry) : fail(result.failure.type);
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
        const entry = { room: created.room, sockets: new Map() };
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
      seat?.entry.sockets.delete(seat.bowlerId);
    });
  });
};
