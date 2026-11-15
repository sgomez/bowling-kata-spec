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
const TOKEN_KEY = "token";
const RETRY_MS = 1_000;

export type SessionSocket = Pick<
  WebSocket,
  "readyState" | "send" | "onopen" | "onmessage" | "onclose"
>;

export type TokenStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface Seat {
  you: BowlerId;
  room: RoomSnapshot;
  receivedAt: number;
}

interface SessionOptions {
  storage?: () => TokenStore;
  retry?: (run: () => void) => void;
}

export type Session = ReturnType<typeof createSession>;

const attempt = <T>(run: () => T): T | undefined => {
  try {
    return run();
  } catch {
    return undefined;
  }
};

export const createSession = (
  connect: () => SessionSocket,
  now: () => number = Date.now,
  {
    storage = () => localStorage,
    retry = (run) => setTimeout(run, RETRY_MS),
  }: SessionOptions = {},
) => {
  const seat = signal<Seat | undefined>(undefined);
  const error = signal<ErrorCode | undefined>(undefined);
  const removed = signal(false);
  let token = attempt(() => storage().getItem(TOKEN_KEY)) ?? undefined;
  let socket: SessionSocket | undefined;
  let pending: ClientMessage[] = [];

  const keep = (next: string) => {
    token = next;
    attempt(() => storage().setItem(TOKEN_KEY, next));
  };

  const forget = () => {
    token = undefined;
    seat.value = undefined;
    attempt(() => storage().removeItem(TOKEN_KEY));
  };

  const receive = (message: ServerMessage) => {
    if (message.type === "room") {
      keep(message.token);
      seat.value = { you: message.you, room: message.room, receivedAt: now() };
      error.value = undefined;
      removed.value = false;
    } else if (message.type === "removed") {
      forget();
      removed.value = true;
    } else {
      if (message.error === "UNKNOWN_SESSION") {
        forget();
      }
      error.value = message.error;
    }
  };

  const open = () => {
    const next = connect();
    next.onopen = () => {
      for (const message of pending) {
        next.send(JSON.stringify(message));
      }
      pending = [];
    };
    next.onmessage = ({ data }) => receive(JSON.parse(String(data)));
    next.onclose = () => {
      socket = undefined;
      pending = [];
      if (token) {
        retry(resume);
      }
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

  const resume = () => {
    if (token) {
      send({ type: "resume", token });
    }
  };

  resume();

  return {
    seat,
    error,
    removed,
    create: (nickname: string) => send({ type: "create", nickname }),
    join: (code: string, nickname: string) =>
      send({ type: "join", code, nickname }),
    start: () => send({ type: "start" }),
    roll: (pins: Pin[]) => send({ type: "roll", pins }),
    remove: (bowlerId: BowlerId) => send({ type: "remove", bowlerId }),
    leave: () => {
      send({ type: "leave" });
      forget();
    },
  };
};
