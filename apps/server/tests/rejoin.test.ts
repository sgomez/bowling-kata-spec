import type { RoomSnapshot, ServerMessage } from "@bowling/domain";
import { describe, expect, it } from "vitest";
import { type Client, useServer } from "./harness.js";

const { connect, createRoom } = useServer();

type RoomMessage = Extract<ServerMessage, { type: "room" }>;

const roomMessage = async (client: Client): Promise<RoomMessage> => {
  const message = await client.next();
  if (message.type !== "room") {
    throw new Error(message.type);
  }
  return message;
};

const snapshot = async (client: Client): Promise<RoomSnapshot> =>
  (await roomMessage(client)).room;

const join = async (code: string, nickname: string) => {
  const client = await connect();
  client.send({ type: "join", code, nickname });
  const { you, token } = await roomMessage(client);
  return { client, you, token };
};

describe("resuming a seat", () => {
  it("gives a different random token to each Bowler", async () => {
    const { host, code, token } = await createRoom();
    const bea = await join(code, "Bea");
    await host.next();

    expect(token).toMatch(/.{30,}/);
    expect(bea.token).not.toBe(token);
  });

  it("restores the Bowler's place and standing Pins mid-Frame", async () => {
    const { host: ana, code } = await createRoom();
    const bea = await join(code, "Bea");
    await ana.next();
    ana.send({ type: "start" });
    await snapshot(ana);
    await snapshot(bea.client);
    bea.client.send({ type: "roll", pins: [1, 2, 3] });
    await snapshot(bea.client);
    await snapshot(ana);

    bea.client.close();
    expect((await snapshot(ana)).bowlers[1].connected).toBe(false);

    const again = await connect();
    again.send({ type: "resume", token: bea.token });

    const resumed = await roomMessage(again);
    expect(resumed.you).toBe(bea.you);
    expect(resumed.token).toBe(bea.token);
    expect(resumed.room.standing).toEqual([4, 5, 6, 7, 8, 9, 10]);
    expect(resumed.room.bowlers[1].connected).toBe(true);
    expect((await snapshot(ana)).bowlers[1].connected).toBe(true);
  });

  it("takes the seat over from a connection still open", async () => {
    const { host: ana, code } = await createRoom();
    const bea = await join(code, "Bea");
    await ana.next();

    const again = await connect();
    again.send({ type: "resume", token: bea.token });
    await snapshot(again);
    await snapshot(ana);

    again.send({ type: "start" });
    expect(await again.next()).toEqual({ type: "error", error: "NOT_HOST" });
  });

  it("refuses an unknown token", async () => {
    const stranger = await connect();

    stranger.send({ type: "resume", token: "22222.nope" });

    expect(await stranger.next()).toEqual({
      type: "error",
      error: "UNKNOWN_SESSION",
    });
  });
});
