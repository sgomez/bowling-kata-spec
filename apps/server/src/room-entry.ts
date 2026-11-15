import type {
  BowlerId,
  CloseReason,
  Room,
  ServerMessage,
} from "@bowling/domain";
import type { WebSocket } from "ws";
import type { Clock } from "./clock.js";
import { expiresAt, type Limits, type RoomTimes } from "./limits.js";

export const send = (socket: WebSocket, message: ServerMessage) =>
  socket.send(JSON.stringify(message));

export const sendClosed = (socket: WebSocket, reason: CloseReason) => {
  send(socket, { type: "closed", reason });
  socket.close(reason === "SERVER_SHUTDOWN" ? 1001 : 1000);
};

export class RoomEntry {
  readonly sockets = new Map<BowlerId, WebSocket>();
  readonly tokens = new Map<BowlerId, string>();
  private cancelTimer: (() => void) | undefined;
  private cancelExpiry: (() => void) | undefined;
  private disposed = false;
  private readonly times: RoomTimes;

  constructor(
    readonly room: Room,
    private readonly clock: Clock,
    private readonly limits: Limits,
    private readonly onClosed: (entry: RoomEntry) => void,
  ) {
    this.times = {
      createdAt: clock.now(),
      abandonedAt: undefined,
      finishedAt: undefined,
    };
  }

  changed() {
    if (this.disposed) {
      return;
    }
    const now = this.clock.now();
    this.observe(now);
    const expiry = expiresAt(this.room, this.times, this.limits);
    if (expiry <= now) {
      this.close("ROOM_CLOSED");
      return;
    }
    this.broadcast(now);
    this.reschedule();
    this.cancelExpiry?.();
    this.cancelExpiry = this.clock.schedule(expiry, () => this.changed());
  }

  close(reason: CloseReason) {
    if (this.disposed) {
      return;
    }
    this.dispose();
    for (const socket of this.sockets.values()) {
      sendClosed(socket, reason);
    }
    this.sockets.clear();
    this.onClosed(this);
  }

  bowlerWith(token: string) {
    return [...this.tokens].find(([, t]) => t === token)?.[0];
  }

  dispose() {
    this.disposed = true;
    this.cancelTimer?.();
    this.cancelExpiry?.();
  }

  private observe(now: number) {
    const { abandonedAt, finishedAt } = this.times;
    this.times.abandonedAt =
      this.sockets.size === 0 ? (abandonedAt ?? now) : undefined;
    this.times.finishedAt =
      this.room.lifecycle().phase === "finished"
        ? (finishedAt ?? now)
        : undefined;
  }

  private broadcast(now: number) {
    for (const [you, socket] of this.sockets) {
      const token = this.tokens.get(you) ?? "";
      const room = this.room.snapshot(you, now);
      send(socket, { type: "room", you, token, room });
    }
  }

  private reschedule() {
    this.cancelTimer?.();
    const at = this.room.nextDeadline();
    if (at !== undefined) {
      this.cancelTimer = this.clock.schedule(at, () => {
        this.room.advance(this.clock.now());
        this.changed();
      });
    }
  }
}
