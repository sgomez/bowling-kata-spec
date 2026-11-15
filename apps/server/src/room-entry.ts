import type { BowlerId, Room, ServerMessage } from "@bowling/domain";
import type { WebSocket } from "ws";
import type { Clock } from "./clock.js";

export const send = (socket: WebSocket, message: ServerMessage) =>
  socket.send(JSON.stringify(message));

export class RoomEntry {
  readonly sockets = new Map<BowlerId, WebSocket>();
  private cancelTimer: (() => void) | undefined;
  private disposed = false;

  constructor(
    readonly room: Room,
    private readonly clock: Clock,
  ) {}

  changed() {
    if (this.disposed) {
      return;
    }
    this.broadcast();
    this.reschedule();
  }

  dispose() {
    this.disposed = true;
    this.cancelTimer?.();
  }

  private broadcast() {
    const now = this.clock.now();
    for (const [you, socket] of this.sockets) {
      send(socket, { type: "room", you, room: this.room.snapshot(you, now) });
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
