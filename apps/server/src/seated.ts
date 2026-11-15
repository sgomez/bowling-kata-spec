import type { BowlerId, ClientMessage } from "@bowling/domain";
import type { RoomEntry } from "./room-entry.js";

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
