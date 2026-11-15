import type {
  BowlerId,
  ClientMessage,
  CloseReason,
  ErrorCode,
  FrameNumber,
  Pin,
  RoomSnapshot,
  ServerMessage,
} from "@bowling/domain";
import { signal } from "@preact/signals";
import { reconnectDelay } from "./backoff.js";
import { resumableToken } from "./invite.js";

const OPEN = 1;
const TOKEN_KEY = "token";

export type ConnectionSocket = Pick<
  WebSocket,
  "readyState" | "send" | "onopen" | "onmessage" | "onclose"
>;

export type TokenStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface Seat {
  you: BowlerId;
  room: RoomSnapshot;
  receivedAt: number;
}

interface ConnectionOptions {
  storage?: () => TokenStore;
  retry?: (run: () => void, failures: number) => void;
  invitedTo?: string;
}

export type Connection = ReturnType<typeof createConnection>;

const attempt = <T>(run: () => T): T | undefined => {
  try {
    return run();
  } catch {
    return undefined;
  }
};

export const createConnection = (
  connect: () => ConnectionSocket,
  now: () => number = Date.now,
  {
    storage = () => localStorage,
    retry = (run, failures) => setTimeout(run, reconnectDelay(failures)),
    invitedTo = "",
  }: ConnectionOptions = {},
) => {
  const seat = signal<Seat | undefined>(undefined);
  const error = signal<ErrorCode | undefined>(undefined);
  const removed = signal(false);
  const missed = signal<FrameNumber | undefined>(undefined);
  const entering = signal<"create" | "join" | undefined>(undefined);
  const stored = attempt(() => storage().getItem(TOKEN_KEY)) ?? undefined;
  let token = resumableToken(stored, invitedTo);
  const closed = signal<CloseReason | undefined>(undefined);
  let socket: ConnectionSocket | undefined;
  let pending: ClientMessage[] = [];
  let failures = 0;

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
    entering.value = undefined;
    error.value = undefined;
    removed.value = false;
    closed.value = undefined;
    if (message.type === "room") {
      keep(message.token);
      seat.value = { you: message.you, room: message.room, receivedAt: now() };
      if (message.room.frame?.number !== missed.value) {
        missed.value = undefined;
      }
    } else if (message.type === "removed") {
      forget();
      removed.value = true;
    } else if (message.type === "closed") {
      forget();
      closed.value = message.reason;
    } else {
      if (message.error === "UNKNOWN_TOKEN") {
        forget();
      }
      error.value = message.error;
    }
  };

  const open = () => {
    const next = connect();
    next.onopen = () => {
      failures = 0;
      for (const message of pending) {
        next.send(JSON.stringify(message));
      }
      pending = [];
    };
    next.onmessage = ({ data }) => receive(JSON.parse(String(data)));
    next.onclose = () => {
      socket = undefined;
      pending = [];
      entering.value = undefined;
      if (token) {
        retry(resume, failures++);
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

  if (stored && !token) {
    forget();
  }
  resume();

  return {
    seat,
    error,
    removed,
    closed,
    missed,
    entering,
    miss: () => {
      missed.value = seat.value?.room.frame?.number;
    },
    create: (nickname: string) => {
      entering.value = "create";
      send({ type: "create", nickname });
    },
    join: (code: string, nickname: string) => {
      entering.value = "join";
      send({ type: "join", code, nickname });
    },
    start: () => send({ type: "start" }),
    roll: (pins: Pin[]) => send({ type: "roll", pins }),
    remove: (bowlerId: BowlerId) => send({ type: "remove", bowlerId }),
    leave: () => {
      send({ type: "leave" });
      forget();
    },
    rematch: () => send({ type: "rematch" }),
  };
};
