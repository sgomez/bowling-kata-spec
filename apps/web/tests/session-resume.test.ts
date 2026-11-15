import type { RoomSnapshot } from "@bowling/domain";
import { describe, expect, it } from "vitest";
import { createSession, type TokenStore } from "../src/session.js";
import { FakeSocket } from "./fake-socket.js";

const ROOM = { code: "K7MPQ", phase: "lobby", hostId: "ana" } as RoomSnapshot;

const memoryStore = (token?: string) => {
  const items = new Map<string, string>(token ? [["token", token]] : []);
  const store: TokenStore = {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
    removeItem: (key) => items.delete(key),
  };
  return { items, store };
};

const deny = () => {
  throw new Error("denied");
};
const brokenStore: TokenStore = {
  getItem: deny,
  setItem: deny,
  removeItem: deny,
};

const setup = (store: TokenStore) => {
  const sockets: FakeSocket[] = [];
  const retries: (() => void)[] = [];
  const session = createSession(
    () => {
      const socket = new FakeSocket();
      sockets.push(socket);
      return socket;
    },
    () => 0,
    { storage: () => store, retry: (run) => retries.push(run) },
  );
  const seated = (token = "K7MPQ.t") => {
    sockets.at(-1)?.receive({ type: "room", you: "ana", token, room: ROOM });
  };
  return { session, sockets, retries, seated };
};

describe("session token", () => {
  it("is kept once in a Room", () => {
    const { items, store } = memoryStore();
    const { session, sockets, seated } = setup(store);
    session.create("Ana");
    sockets[0].open();

    seated("K7MPQ.abc");

    expect(items.get("token")).toBe("K7MPQ.abc");
  });

  it("resumes the seat on start", () => {
    const { sockets } = setup(memoryStore("K7MPQ.abc").store);

    sockets[0].open();

    expect(sockets[0].sent).toEqual([{ type: "resume", token: "K7MPQ.abc" }]);
  });

  it("resumes automatically after the connection drops", () => {
    const { session, sockets, retries, seated } = setup(memoryStore().store);
    session.create("Ana");
    sockets[0].open();
    seated();

    sockets[0].drop();
    expect(sockets).toHaveLength(1);
    retries[0]();
    sockets[1].open();

    expect(sockets[1].sent).toEqual([{ type: "resume", token: "K7MPQ.t" }]);
    expect(session.seat.value?.you).toBe("ana");
  });

  it("keeps retrying while the server is unreachable", () => {
    const { session, sockets, retries, seated } = setup(memoryStore().store);
    session.create("Ana");
    sockets[0].open();
    seated();
    sockets[0].drop();
    retries[0]();

    sockets[1].drop();
    retries[1]();
    sockets[2].open();

    expect(sockets[2].sent).toEqual([{ type: "resume", token: "K7MPQ.t" }]);
  });

  it("is forgotten when unknown", () => {
    const { items, store } = memoryStore("K7MPQ.old");
    const { session, sockets } = setup(store);
    sockets[0].open();

    sockets[0].receive({ type: "error", error: "UNKNOWN_SESSION" });
    sockets[0].drop();

    expect(items.has("token")).toBe(false);
    expect(session.seat.value).toBeUndefined();
    expect(session.error.value).toBe("UNKNOWN_SESSION");
  });

  it("is forgotten when the Room closes", () => {
    const { items, store } = memoryStore();
    const { session, sockets, retries, seated } = setup(store);
    session.create("Ana");
    sockets[0].open();
    seated();

    sockets[0].receive({ type: "closed", reason: "ROOM_CLOSED" });
    sockets[0].drop();

    expect(items.has("token")).toBe(false);
    expect(retries).toEqual([]);
  });

  it("works without storage", () => {
    const { session, sockets, retries, seated } = setup(brokenStore);
    session.create("Ana");
    sockets[0].open();
    seated();

    sockets[0].drop();
    retries[0]();
    sockets[1].open();

    expect(sockets[1].sent).toEqual([{ type: "resume", token: "K7MPQ.t" }]);
  });
});

describe("leaving", () => {
  it("tells the server and returns home without resuming", () => {
    const { items, store } = memoryStore();
    const { session, sockets, retries, seated } = setup(store);
    session.create("Ana");
    sockets[0].open();
    seated();

    session.leave();
    sockets[0].drop();

    expect(sockets[0].sent.at(-1)).toEqual({ type: "leave" });
    expect(session.seat.value).toBeUndefined();
    expect(items.has("token")).toBe(false);
    expect(retries).toEqual([]);
  });

  it("lets the Host remove a Bowler", () => {
    const { session, sockets } = setup(memoryStore().store);
    session.create("Ana");
    sockets[0].open();

    session.remove("bea");

    expect(sockets[0].sent.at(-1)).toEqual({
      type: "remove",
      bowlerId: "bea",
    });
  });

  it("returns home with a notice when removed", () => {
    const { items, store } = memoryStore();
    const { session, sockets, seated } = setup(store);
    session.create("Ana");
    sockets[0].open();
    seated();

    sockets[0].receive({ type: "removed" });

    expect(session.seat.value).toBeUndefined();
    expect(session.removed.value).toBe(true);
    expect(items.has("token")).toBe(false);
  });
});
