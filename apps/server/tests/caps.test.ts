import { describe, expect, it } from "vitest";
import { useServer } from "./harness.js";

const { connect, createRoom, time } = useServer({ rooms: 1 });

describe("server caps refuse", () => {
  it("a new Room beyond the Room cap", async () => {
    await createRoom();
    const bea = await connect();

    bea.send({ type: "create", nickname: "Bea" });

    expect(await bea.next()).toEqual({
      type: "error",
      error: "TOO_MANY_ROOMS",
    });
  });

  it("a message over 4 KB", async () => {
    const client = await connect();
    const start = JSON.stringify({ type: "start" });

    client.sendRaw(start.padEnd(4096));
    client.sendRaw(start.padEnd(4097));

    expect(await client.next()).toMatchObject({ error: "NOT_IN_ROOM" });
    expect(await client.next()).toEqual({
      type: "error",
      error: "MESSAGE_TOO_LARGE",
    });
  });

  it("more than 20 messages per second on a connection", async () => {
    const client = await connect();
    const send = () => client.sendRaw(JSON.stringify({ type: "start" }));

    for (let i = 0; i < 21; i++) {
      send();
    }
    const replies = [];
    for (let i = 0; i < 21; i++) {
      replies.push(await client.next());
    }
    time.advance(1000);
    send();

    expect(replies.at(-2)).toMatchObject({ error: "NOT_IN_ROOM" });
    expect(replies.at(-1)).toEqual({
      type: "error",
      error: "TOO_MANY_MESSAGES",
    });
    expect(await client.next()).toMatchObject({ error: "NOT_IN_ROOM" });
  });
});
