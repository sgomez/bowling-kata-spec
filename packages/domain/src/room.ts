import type { RoomCode } from "./room-code.js";

export type BowlerId = string;

export type RoomFailure =
  | { type: "NICKNAME_INVALID" }
  | { type: "NICKNAME_TAKEN" }
  | { type: "ROOM_FULL" }
  | { type: "GAMES_STARTED" }
  | { type: "NOT_HOST" };

export type RoomResult = { ok: true } | { ok: false; failure: RoomFailure };

interface Bowler {
  id: BowlerId;
  nickname: string;
}

type Phase = "lobby" | "playing";

export interface RoomSnapshot {
  code: RoomCode;
  phase: Phase;
  hostId: BowlerId;
  bowlers: Bowler[];
}

export const MAX_BOWLERS = 6;
export const MAX_NICKNAME_LENGTH = 16;

const refuse = (type: RoomFailure["type"]) =>
  ({ ok: false, failure: { type } }) as const;

const isValidNickname = (nickname: string) =>
  nickname.length > 0 && [...nickname].length <= MAX_NICKNAME_LENGTH;

export class Room {
  private readonly bowlers: Bowler[] = [];
  private phase: Phase = "lobby";

  private constructor(
    private readonly code: RoomCode,
    private readonly hostId: BowlerId,
  ) {}

  static create(
    code: RoomCode,
    host: Bowler,
  ): { ok: true; room: Room } | { ok: false; failure: RoomFailure } {
    const room = new Room(code, host.id);
    const joined = room.join(host);
    return joined.ok ? { ok: true, room } : joined;
  }

  join({ id, nickname }: Bowler): RoomResult {
    if (this.phase !== "lobby") {
      return refuse("GAMES_STARTED");
    }
    if (this.bowlers.length >= MAX_BOWLERS) {
      return refuse("ROOM_FULL");
    }
    const trimmed = nickname.trim();
    if (!isValidNickname(trimmed)) {
      return refuse("NICKNAME_INVALID");
    }
    const key = trimmed.toLocaleLowerCase();
    if (this.bowlers.some((b) => b.nickname.toLocaleLowerCase() === key)) {
      return refuse("NICKNAME_TAKEN");
    }
    this.bowlers.push({ id, nickname: trimmed });
    return { ok: true };
  }

  start(bowlerId: BowlerId): RoomResult {
    if (this.phase !== "lobby") {
      return refuse("GAMES_STARTED");
    }
    if (bowlerId !== this.hostId) {
      return refuse("NOT_HOST");
    }
    this.phase = "playing";
    return { ok: true };
  }

  snapshot(): RoomSnapshot {
    return {
      code: this.code,
      phase: this.phase,
      hostId: this.hostId,
      bowlers: this.bowlers.map((bowler) => ({ ...bowler })),
    };
  }
}
