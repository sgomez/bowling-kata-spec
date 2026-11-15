import type { BowlerId, ClientMessage } from "@bowling/domain";
import type { WebSocket } from "ws";
import { type RoomEntry, send } from "./room-entry.js";

export interface Seat {
  entry: RoomEntry;
  bowlerId: BowlerId;
}

const SEATED = ["start", "roll", "rematch", "leave", "remove"] as const;

type SeatedMessage = Extract<ClientMessage, { type: (typeof SEATED)[number] }>;

export const isSeated = (message: ClientMessage): message is SeatedMessage =>
  (SEATED as readonly string[]).includes(message.type);

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
      return entry.room.roll(bowlerId, message.pins, now, message.foul);
    case "leave":
      return entry.room.leave(bowlerId, now);
    case "remove":
      return entry.room.remove(bowlerId, message.bowlerId, now);
  }
};

export const createSeats = () => {
  const seats = new WeakMap<WebSocket, Seat>();

  const unseat = (entry: RoomEntry, bowlerId: BowlerId) => {
    const socket = entry.unseat(bowlerId);
    if (socket) {
      seats.delete(socket);
    }
    return socket;
  };

  return {
    get: (socket: WebSocket) => seats.get(socket),
    release: (socket: WebSocket) => seats.delete(socket),
    sit: (socket: WebSocket, entry: RoomEntry, bowlerId: BowlerId) => {
      const previous = entry.seat(bowlerId, socket);
      if (previous) {
        seats.delete(previous);
        previous.close();
      }
      seats.set(socket, { entry, bowlerId });
      entry.changed();
    },
    afterSeated: (seat: Seat, message: SeatedMessage) => {
      if (message.type === "leave") {
        unseat(seat.entry, seat.bowlerId);
      }
      if (message.type === "remove") {
        const removed = unseat(seat.entry, message.bowlerId);
        if (removed && message.bowlerId !== seat.bowlerId) {
          send(removed, { type: "removed" });
        }
      }
      seat.entry.changed();
    },
  };
};
