import type {
  BowlerId,
  ClientMessage,
  ErrorCode,
  Pin,
  RoomSnapshot,
  ServerMessage,
} from "@bowling/domain";
import { signal } from "@preact/signals";

const OPEN = 1;

export type SessionSocket = Pick<
  WebSocket,
  "readyState" | "send" | "onopen" | "onmessage" | "onclose"
>;

export interface Seat {
  you: BowlerId;
  room: RoomSnapshot;
  receivedAt: number;
}

export type Session = ReturnType<typeof createSession>;

export const createSession = (
  connect: () => SessionSocket,
  now: () => number = Date.now,
) => {
  const seat = signal<Seat | undefined>(undefined);
  const error = signal<ErrorCode | undefined>(undefined);
  let socket: SessionSocket | undefined;
  let pending: ClientMessage[] = [];

  const open = () => {
    const next = connect();
    next.onopen = () => {
      for (const message of pending) {
        next.send(JSON.stringify(message));
      }
      pending = [];
    };
    next.onmessage = ({ data }) => {
      const message = JSON.parse(String(data)) as ServerMessage;
      if (message.type === "room") {
        seat.value = {
          you: message.you,
          room: message.room,
          receivedAt: now(),
        };
        error.value = undefined;
      } else {
        error.value = message.error;
      }
    };
    next.onclose = () => {
      socket = undefined;
    };
    return next;
  };

  const send = (message: ClientMessage) => {
    socket ??= open();
    if (socket.readyState === OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      pending.push(message);
    }
  };

  return {
    seat,
    error,
    create: (nickname: string) => send({ type: "create", nickname }),
    join: (code: string, nickname: string) =>
      send({ type: "join", code, nickname }),
    start: () => send({ type: "start" }),
    roll: (pins: Pin[]) => send({ type: "roll", pins }),
    rematch: () => send({ type: "rematch" }),
  };
};
