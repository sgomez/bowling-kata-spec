import {
  allStanding,
  type Bowler,
  type BowlerId,
  fillFrame,
  hasFinished,
  knock,
  type Newcomer,
  newBowler,
  resetGame,
} from "./bowler.js";
import { type FrameNumber, TENTH_FRAME } from "./frame.js";
import {
  acceptsRollAt,
  dueAt,
  type FrameWindow,
  openWindow,
  revealWindow,
} from "./frame-window.js";
import { connectedHeirOf, heirOf } from "./host.js";
import { parseNickname } from "./nickname.js";
import type { Pin } from "./pins.js";
import type { RoomCode } from "./room-code.js";
import { type Created, OK, type RoomResult, refuse } from "./room-result.js";
import {
  type Phase,
  type RoomSnapshot,
  roomSnapshot,
} from "./room-snapshot.js";

export const MAX_BOWLERS = 6;

export class Room {
  private readonly bowlers: Bowler[] = [];
  private phase: Phase = "lobby";
  private window: FrameWindow | undefined;

  private constructor(
    readonly code: RoomCode,
    private hostId: BowlerId,
  ) {}

  static create(code: RoomCode, host: Newcomer): Created<Room> {
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
    const name = parseNickname(nickname);
    if (name === undefined) {
      return refuse("NICKNAME_INVALID");
    }
    const key = name.toLocaleLowerCase();
    if (this.bowlers.some((b) => b.nickname.toLocaleLowerCase() === key)) {
      return refuse("NICKNAME_TAKEN");
    }
    this.bowlers.push(newBowler(id, name));
    return OK;
  }

  start(bowlerId: BowlerId, now: number): RoomResult {
    if (this.phase !== "lobby") {
      return refuse("GAMES_STARTED");
    }
    if (bowlerId !== this.hostId) {
      return refuse("NOT_HOST");
    }
    return this.play(now);
  }

  rematch(bowlerId: BowlerId, now: number): RoomResult {
    if (bowlerId !== this.hostId) {
      return refuse("NOT_HOST");
    }
    if (this.phase !== "finished") {
      return refuse("GAMES_NOT_FINISHED");
    }
    return this.play(now);
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
      if (bowlerId === this.hostId) {
        this.hostId = connectedHeirOf(this.bowlers, bowlerId);
      }
      this.closeIfEveryoneFinished(now);
    }
  }

  reconnect(bowlerId: BowlerId): RoomResult {
    const bowler = this.find(bowlerId);
    if (!bowler) {
      return refuse("NOT_IN_ROOM");
    }
    bowler.connected = true;
    if (!this.find(this.hostId)?.connected) {
      this.hostId = bowlerId;
    }
    return OK;
  }

  leave(bowlerId: BowlerId, now: number): RoomResult {
    const at = this.bowlers.findIndex((b) => b.id === bowlerId);
    if (at < 0) {
      return refuse("NOT_IN_ROOM");
    }
    if (bowlerId === this.hostId) {
      this.hostId = heirOf(this.bowlers, bowlerId);
    }
    this.bowlers.splice(at, 1);
    this.closeIfEveryoneFinished(now);
    return OK;
  }

  remove(hostId: BowlerId, bowlerId: BowlerId, now: number): RoomResult {
    return hostId === this.hostId
      ? this.leave(bowlerId, now)
      : refuse("NOT_HOST");
  }

  isEmpty() {
    return this.bowlers.length === 0;
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

  private play(now: number) {
    this.bowlers.forEach(resetGame);
    this.phase = "playing";
    this.window = openWindow(1, now);
    return OK;
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
