import {
  allStanding,
  type Bowler,
  type BowlerId,
  fillFrame,
  hasFinished,
  knock,
  newBowler,
} from "./bowler.js";
import { type FrameNumber, TENTH_FRAME } from "./frame.js";
import {
  acceptsRollAt,
  dueAt,
  type FrameWindow,
  openWindow,
  revealWindow,
} from "./frame-window.js";
import type { Pin } from "./pins.js";
import type { RoomCode } from "./room-code.js";
import {
  type Phase,
  type RoomSnapshot,
  roomSnapshot,
} from "./room-snapshot.js";

export type RoomFailure =
  | { type: "NICKNAME_INVALID" }
  | { type: "NICKNAME_TAKEN" }
  | { type: "ROOM_FULL" }
  | { type: "GAMES_STARTED" }
  | { type: "NOT_HOST" }
  | { type: "NOT_IN_ROOM" }
  | { type: "WINDOW_CLOSED" }
  | { type: "FRAME_FINISHED" }
  | { type: "PIN_NOT_STANDING" };

export type RoomResult = { ok: true } | { ok: false; failure: RoomFailure };

interface Newcomer {
  id: BowlerId;
  nickname: string;
}

export const MAX_BOWLERS = 6;
export const MAX_NICKNAME_LENGTH = 16;

const OK = { ok: true } as const;

const refuse = (type: RoomFailure["type"]) =>
  ({ ok: false, failure: { type } }) as const;

const isValidNickname = (nickname: string) =>
  nickname.length > 0 && [...nickname].length <= MAX_NICKNAME_LENGTH;

export class Room {
  private readonly bowlers: Bowler[] = [];
  private phase: Phase = "lobby";
  private window: FrameWindow | undefined;

  private constructor(
    private readonly code: RoomCode,
    private readonly hostId: BowlerId,
  ) {}

  static create(
    code: RoomCode,
    host: Newcomer,
  ): { ok: true; room: Room } | { ok: false; failure: RoomFailure } {
    const room = new Room(code, host.id);
    const joined = room.join(host);
    return joined.ok ? { ok: true, room } : joined;
  }

  join({ id, nickname }: Newcomer): RoomResult {
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
    this.bowlers.push(newBowler(id, trimmed));
    return OK;
  }

  start(bowlerId: BowlerId, now: number): RoomResult {
    if (this.phase !== "lobby") {
      return refuse("GAMES_STARTED");
    }
    if (bowlerId !== this.hostId) {
      return refuse("NOT_HOST");
    }
    this.phase = "playing";
    this.window = openWindow(1, now);
    return OK;
  }

  roll(bowlerId: BowlerId, pins: readonly Pin[], now: number): RoomResult {
    const bowler = this.find(bowlerId);
    const window = this.window;
    if (!bowler) {
      return refuse("NOT_IN_ROOM");
    }
    if (!window || !acceptsRollAt(window, now)) {
      return refuse("WINDOW_CLOSED");
    }
    if (hasFinished(bowler, window.frame)) {
      return refuse("FRAME_FINISHED");
    }
    if (!allStanding(bowler, pins)) {
      return refuse("PIN_NOT_STANDING");
    }
    knock(bowler, pins);
    this.closeIfEveryoneFinished(now);
    return OK;
  }

  disconnect(bowlerId: BowlerId, now: number): void {
    const bowler = this.find(bowlerId);
    if (bowler) {
      bowler.connected = false;
      this.closeIfEveryoneFinished(now);
    }
  }

  nextDeadline(): number | undefined {
    return this.window && dueAt(this.window);
  }

  advance(now: number): void {
    const window = this.window;
    if (!window || now < dueAt(window)) {
      return;
    }
    if (window.open) {
      this.closeWindow(window.frame, now);
    } else {
      this.window = openWindow((window.frame + 1) as FrameNumber, now);
    }
  }

  lifecycle(): { phase: Phase; bowlerCount: number } {
    return { phase: this.phase, bowlerCount: this.bowlers.length };
  }

  snapshot(viewer: BowlerId, now: number): RoomSnapshot {
    return roomSnapshot({
      code: this.code,
      phase: this.phase,
      hostId: this.hostId,
      bowlers: this.bowlers,
      window: this.window,
      viewer,
      now,
    });
  }

  private find(bowlerId: BowlerId) {
    return this.bowlers.find((b) => b.id === bowlerId);
  }

  private closeIfEveryoneFinished(now: number) {
    const window = this.window;
    const connected = this.bowlers.filter((b) => b.connected);
    if (
      window?.open &&
      connected.length > 0 &&
      connected.every((b) => hasFinished(b, window.frame))
    ) {
      this.closeWindow(window.frame, now);
    }
  }

  private closeWindow(frame: FrameNumber, now: number) {
    for (const bowler of this.bowlers) {
      fillFrame(bowler, frame);
    }
    if (frame === TENTH_FRAME) {
      this.phase = "finished";
      this.window = undefined;
    } else {
      this.window = revealWindow(frame, now);
    }
  }
}
