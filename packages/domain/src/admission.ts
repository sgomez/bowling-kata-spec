import { type Bowler, type Newcomer, newBowler } from "./bowler.js";
import { parseNickname } from "./nickname.js";
import type { RoomFailure } from "./room-failure.js";
import type { Phase } from "./room-snapshot.js";

export const MAX_BOWLERS = 6;

export const admit = (
  bowlers: readonly Bowler[],
  phase: Phase,
  { id, nickname }: Newcomer,
): Bowler | RoomFailure["type"] => {
  if (phase !== "lobby") {
    return "GAMES_STARTED";
  }
  if (bowlers.length >= MAX_BOWLERS) {
    return "ROOM_FULL";
  }
  const name = parseNickname(nickname);
  if (name === undefined) {
    return "NICKNAME_INVALID";
  }
  const key = name.toLocaleLowerCase();
  return bowlers.some((b) => b.nickname.toLocaleLowerCase() === key)
    ? "NICKNAME_TAKEN"
    : newBowler(id, name);
};
