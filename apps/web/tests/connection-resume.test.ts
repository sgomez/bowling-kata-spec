import { describe, expect, it } from "vitest";
import type { TokenStore } from "../src/connection.js";
import { memoryStore, setup } from "./connection-setup.js";

const deny = () => {
  throw new Error("denied");
};
const brokenStore: TokenStore = {
  getItem: deny,
  setItem: deny,
  removeItem: deny,
};

describe("resume token", () => {
  it("is kept once in a Room", () => {
    const { items, store } = memoryStore();
    const { connection, sockets, seated } = setup(store);
    connection.create("Ana");
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
    const { connection, sockets, retries, seated } = setup(memoryStore().store);
    connection.create("Ana");
    sockets[0].open();
    seated();

    sockets[0].drop();
    expect(sockets).toHaveLength(1);
    retries[0]();
    sockets[1].open();

    expect(sockets[1].sent).toEqual([{ type: "resume", token: "K7MPQ.t" }]);
    expect(connection.seat.value?.you).toBe("ana");
  });

  it("keeps retrying while the server is unreachable", () => {
    const { connection, sockets, retries, seated } = setup(memoryStore().store);
    connection.create("Ana");
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
    const { connection, sockets } = setup(store);
    sockets[0].open();

    sockets[0].receive({ type: "error", error: "UNKNOWN_TOKEN" });
    sockets[0].drop();

    expect(items.has("token")).toBe(false);
    expect(connection.seat.value).toBeUndefined();
    expect(connection.error.value).toBe("UNKNOWN_TOKEN");
  });

  it("is forgotten when the Room closes", () => {
    const { items, store } = memoryStore();
    const { connection, sockets, retries, seated } = setup(store);
    connection.create("Ana");
    sockets[0].open();
    seated();

    sockets[0].receive({ type: "closed", reason: "ROOM_CLOSED" });
    sockets[0].drop();

    expect(items.has("token")).toBe(false);
    expect(retries).toEqual([]);
  });

  it("works without storage", () => {
    const { connection, sockets, retries, seated } = setup(brokenStore);
    connection.create("Ana");
    sockets[0].open();
    seated();

    sockets[0].drop();
    retries[0]();
    sockets[1].open();

    expect(sockets[1].sent).toEqual([{ type: "resume", token: "K7MPQ.t" }]);
  });
});
