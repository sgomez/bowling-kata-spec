import type { RoomSnapshot } from "@bowling/domain";
import { createConnection, type TokenStore } from "../src/connection.js";
import { FakeSocket } from "./fake-socket.js";

const ROOM = { code: "K7MPQ", phase: "lobby", hostId: "ana" } as RoomSnapshot;

export const memoryStore = (token?: string) => {
  const items = new Map<string, string>(token ? [["token", token]] : []);
  const store: TokenStore = {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
    removeItem: (key) => items.delete(key),
  };
  return { items, store };
};

export const setup = (store: TokenStore, invitedTo = "") => {
  const sockets: FakeSocket[] = [];
  const retries: (() => void)[] = [];
  const failures: number[] = [];
  const clock = { now: 0 };
  const connection = createConnection(
    () => {
      const socket = new FakeSocket();
      sockets.push(socket);
      return socket;
    },
    () => clock.now,
    {
      storage: () => store,
      backoff: (failed) => {
        failures.push(failed);
        return 1000 * (failed + 1);
      },
      retry: (run) => {
        retries.push(run);
      },
      invitedTo,
    },
  );
  const seated = (token = "K7MPQ.t") => {
    sockets.at(-1)?.receive({ type: "room", you: "ana", token, room: ROOM });
  };
  return { connection, sockets, retries, failures, clock, seated };
};
