import { describe, expect, it } from "vitest";
import { noticeOf, useServer } from "./harness.js";

const { connect, createRoom, joinRoom, shutdown, expectEmpty } = useServer();

describe("shutting the server down", () => {
  it("tells every client, closes their sockets and destroys every Room", async () => {
    const { host, code } = await createRoom();
    const bea = await joinRoom(code, "Bea");
    const stranger = await connect();

    await shutdown();

    for (const client of [host, bea, stranger]) {
      expect(await noticeOf(client)).toEqual({
        type: "closed",
        reason: "SERVER_SHUTDOWN",
      });
      await client.closed;
    }
    await expectEmpty();
  });
});
