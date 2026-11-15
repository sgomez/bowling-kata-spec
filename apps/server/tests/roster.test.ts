import type { RoomSnapshot } from "@bowling/domain";
import { describe, expect, it } from "vitest";
import { type Client, useServer } from "./harness.js";

const { connect, createRoom } = useServer();

const roomOf = async (client: Client) => {
  const message = await client.next();
  if (message.type !== "room") {
    throw new Error(message.type);
  }
  return message;
};

const nicknames = (room: RoomSnapshot) => room.bowlers.map((b) => b.nickname);

const threeBowlers = async () => {
  const { host: ana, code } = await createRoom();
  const join = async (nickname: string) => {
    const client = await connect();
    client.send({ type: "join", code, nickname });
    return { client, ...(await roomOf(client)) };
  };
  const bea = await join("Bea");
  await ana.next();
  const carlos = await join("Carlos");
  await ana.next();
  await bea.client.next();
  return { ana, bea, carlos, code };
};

describe("leaving a Room", () => {
  it("drops the Bowler for everyone and frees the connection", async () => {
    const { ana, bea } = await threeBowlers();

    bea.client.send({ type: "leave" });

    expect(nicknames((await roomOf(ana)).room)).toEqual(["Ana", "Carlos"]);
    bea.client.send({ type: "create", nickname: "Bea" });
    expect((await roomOf(bea.client)).room.bowlers).toHaveLength(1);
  });

  it("passes the Host to the next connected Bowler", async () => {
    const { ana, bea, carlos } = await threeBowlers();
    bea.client.close();
    await roomOf(ana);
    await roomOf(carlos.client);

    ana.send({ type: "leave" });

    expect((await roomOf(carlos.client)).room.hostId).toBe(carlos.you);
  });

  it("destroys the Room when the last Bowler leaves", async () => {
    const { host, code } = await createRoom();

    host.send({ type: "leave" });
    const late = await connect();
    late.send({ type: "join", code, nickname: "Bea" });

    expect(await late.next()).toEqual({ type: "error", error: "UNKNOWN_ROOM" });
  });

  it("is refused outside a Room", async () => {
    const stranger = await connect();

    stranger.send({ type: "leave" });

    expect(await stranger.next()).toEqual({
      type: "error",
      error: "NOT_IN_ROOM",
    });
  });
});

describe("the Host removing a Bowler", () => {
  it("tells the Bowler and drops them for everyone", async () => {
    const { ana, bea, carlos } = await threeBowlers();

    ana.send({ type: "remove", bowlerId: bea.you });

    expect(await bea.client.next()).toEqual({ type: "removed" });
    expect(nicknames((await roomOf(carlos.client)).room)).toEqual([
      "Ana",
      "Carlos",
    ]);
  });

  it("stops the removed Bowler's token resuming", async () => {
    const { ana, bea } = await threeBowlers();
    ana.send({ type: "remove", bowlerId: bea.you });
    await bea.client.next();

    const again = await connect();
    again.send({ type: "resume", token: bea.token });

    expect(await again.next()).toEqual({
      type: "error",
      error: "UNKNOWN_SESSION",
    });
  });

  it("is refused to anyone but the Host", async () => {
    const { bea, carlos } = await threeBowlers();

    bea.client.send({ type: "remove", bowlerId: carlos.you });

    expect(await bea.client.next()).toEqual({
      type: "error",
      error: "NOT_HOST",
    });
  });

  it("is refused outside a Room", async () => {
    const stranger = await connect();

    stranger.send({ type: "remove", bowlerId: "bea" });

    expect(await stranger.next()).toEqual({
      type: "error",
      error: "NOT_IN_ROOM",
    });
  });
});

describe("the Host disconnecting", () => {
  it("passes the Host to the next connected Bowler", async () => {
    const { ana, bea } = await threeBowlers();

    ana.close();

    expect((await roomOf(bea.client)).room.hostId).toBe(bea.you);
  });
});
