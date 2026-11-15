import type { Pin } from "../src/pins.js";
import { Room } from "../src/room.js";
import type { RoomCode } from "../src/room-code.js";

export const T0 = 1_000_000;

export const STRIKE: Pin[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const startedRoom = (...others: string[]) => {
  const created = Room.create("K7MPQ" as RoomCode, {
    id: "ana",
    nickname: "Ana",
  });
  if (!created.ok) {
    throw new Error(created.failure.type);
  }
  for (const id of others) {
    created.room.join({ id, nickname: id });
  }
  created.room.start("ana", T0);
  return created.room;
};

export const skipFrames = (room: Room, frames: number) => {
  let now = T0;
  for (let i = 0; i < 2 * frames; i++) {
    now = room.nextDeadline() as number;
    room.advance(now);
  }
  return now;
};
