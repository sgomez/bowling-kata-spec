import type { BowlerId, ClientMessage } from "@bowling/domain";
import type { WebSocket } from "ws";
import { type RoomEntry, send } from "./room-entry.js";

export interface Seat {
  entry: RoomEntry;
  bowlerId: BowlerId;
}

export type SeatedMessage = Extract<
  ClientMessage,
  { type: "start" | "roll" | "rematch" | "leave" | "remove" }
>;

export const isSeated = (message: ClientMessage): message is SeatedMessage =>
  ["start", "roll", "rematch", "leave", "remove"].includes(message.type);

export const act = (
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
    case "leave":
      return entry.room.leave(bowlerId, now);
    case "remove":
      return entry.room.remove(bowlerId, message.bowlerId, now);
  }
};

export const createSeats = () => {
  const seats = new WeakMap<WebSocket, Seat>();

  const unseat = (entry: RoomEntry, bowlerId: BowlerId) => {
    const socket = entry.sockets.get(bowlerId);
    if (socket) {
      seats.delete(socket);
    }
    entry.sockets.delete(bowlerId);
    entry.tokens.delete(bowlerId);
    return socket;
  };

  return {
    get: (socket: WebSocket) => seats.get(socket),
    release: (socket: WebSocket) => seats.delete(socket),
    sit: (socket: WebSocket, entry: RoomEntry, bowlerId: BowlerId) => {
      const previous = entry.sockets.get(bowlerId);
      if (previous) {
        seats.delete(previous);
        previous.close();
      }
      seats.set(socket, { entry, bowlerId });
      entry.sockets.set(bowlerId, socket);
      entry.changed();
    },
    afterSeated: (seat: Seat, message: SeatedMessage) => {
      if (message.type === "leave") {
        unseat(seat.entry, seat.bowlerId);
      }
      if (message.type === "remove") {
        const removed = unseat(seat.entry, message.bowlerId);
        if (removed) {
          send(removed, { type: "removed" });
        }
      }
      seat.entry.changed();
    },
  };
};
