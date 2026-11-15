import { describe, expect, it } from "vitest";
import { memoryStore, setup } from "./connection-setup.js";

describe("leaving", () => {
  it("tells the server and returns home without resuming", () => {
    const { items, store } = memoryStore();
    const { connection, sockets, retries, seated } = setup(store);
    connection.create("Ana");
    sockets[0].open();
    seated();

    connection.leave();
    sockets[0].drop();

    expect(sockets[0].sent.at(-1)).toEqual({ type: "leave" });
    expect(connection.seat.value).toBeUndefined();
    expect(items.has("token")).toBe(false);
    expect(retries).toEqual([]);
  });

  it("lets the Host remove a Bowler", () => {
    const { connection, sockets } = setup(memoryStore().store);
    connection.create("Ana");
    sockets[0].open();

    connection.remove("bea");

    expect(sockets[0].sent.at(-1)).toEqual({
      type: "remove",
      bowlerId: "bea",
    });
  });

  it("returns home with a notice when removed", () => {
    const { items, store } = memoryStore();
    const { connection, sockets, seated } = setup(store);
    connection.create("Ana");
    sockets[0].open();
    seated();

    sockets[0].receive({ type: "removed" });

    expect(connection.seat.value).toBeUndefined();
    expect(connection.removed.value).toBe(true);
    expect(items.has("token")).toBe(false);
  });
});
