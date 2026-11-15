import type { Room } from "@bowling/domain";

const MINUTE = 60_000;

export const DEFAULT_LIMITS = {
  rooms: 100,
  connectionsPerAddress: 10,
  messageBytes: 4096,
  messagesPerSecond: 20,
  lobbyMs: 15 * MINUTE,
  abandonedMs: 2 * MINUTE,
  finishedMs: 5 * MINUTE,
  absoluteMs: 120 * MINUTE,
};

export type Limits = typeof DEFAULT_LIMITS;

export interface RoomTimes {
  createdAt: number;
  abandonedAt: number | undefined;
  finishedAt: number | undefined;
}

export const expiresAt = (
  room: Room,
  { createdAt, abandonedAt, finishedAt }: RoomTimes,
  limits: Limits,
): number => {
  const { phase, bowlerCount } = room.lifecycle();
  if (bowlerCount === 0) {
    return Number.NEGATIVE_INFINITY;
  }
  return Math.min(
    createdAt + limits.absoluteMs,
    phase === "lobby" ? createdAt + limits.lobbyMs : Infinity,
    (abandonedAt ?? Infinity) + limits.abandonedMs,
    (finishedAt ?? Infinity) + limits.finishedMs,
  );
};
