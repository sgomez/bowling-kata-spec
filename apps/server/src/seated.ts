import type { BowlerId, ClientMessage } from "@bowling/domain";
import type { RoomEntry } from "./room-entry.js";

export interface Seat {
  entry: RoomEntry;
  bowlerId: BowlerId;
}

export type SeatedMessage = Extract<
  ClientMessage,
  { type: "start" | "roll" | "leave" | "remove" }
>;

export const act = (
  { entry, bowlerId }: Seat,
  message: SeatedMessage,
  now: number,
) =>
  message.type === "start"
    ? entry.room.start(bowlerId, now)
    : message.type === "roll"
      ? entry.room.roll(bowlerId, message.pins, now)
      : message.type === "leave"
        ? entry.room.leave(bowlerId, now)
        : entry.room.remove(bowlerId, message.bowlerId, now);

export const isSeated = (message: ClientMessage): message is SeatedMessage =>
  ["start", "roll", "leave", "remove"].includes(message.type);
