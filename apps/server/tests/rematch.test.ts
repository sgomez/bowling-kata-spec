import type { RoomSnapshot } from "@bowling/domain";
import { describe, expect, it } from "vitest";
import { type Client, useServer } from "./harness.js";

const { createRoom, joinRoom, time } = useServer();

const snapshot = async (client: Client): Promise<RoomSnapshot> => {
  const message = await client.next();
  if (message.type !== "room") {
    throw new Error(JSON.stringify(message));
  }
  return message.room;
};

const untilFinished = async (client: Client) => {
  let room = await snapshot(client);
  while (room.phase !== "finished") {
    room = await snapshot(client);
  }
  return room;
};

const finishedGames = async () => {
  const { host: ana, code } = await createRoom();
  const bea = await joinRoom(code, "Bea");
  await ana.next();
  ana.send({ type: "start" });
  await snapshot(ana);
  await snapshot(bea);
  ana.send({ type: "roll", pins: [1] });
  await snapshot(ana);
  await snapshot(bea);
  time.advance(9 * 35_500 + 45_500);
  await untilFinished(ana);
  await untilFinished(bea);
  return { ana, bea, code };
};

describe("a Rematch", () => {
  it("starts new Games in the same Room for everyone", async () => {
    const { ana, bea, code } = await finishedGames();

    ana.send({ type: "rematch" });

    for (const client of [ana, bea]) {
      const room = await snapshot(client);
      expect(room).toMatchObject({
        code,
        phase: "playing",
        frame: { number: 1, open: true, remainingMs: 30_000 },
      });
      expect(room.bowlers.map((b) => b.total)).toEqual([0, 0]);
    }
    time.advance(30_500);
    expect((await snapshot(bea)).frame?.open).toBe(false);
  });

  it("is refused to a Bowler who is not the Host", async () => {
    const { bea } = await finishedGames();

    bea.send({ type: "rematch" });

    expect(await bea.next()).toEqual({ type: "error", error: "NOT_HOST" });
  });

  it("is refused while the Games are being played", async () => {
    const { host } = await createRoom();
    host.send({ type: "start" });
    await snapshot(host);

    host.send({ type: "rematch" });

    expect(await host.next()).toEqual({
      type: "error",
      error: "GAMES_NOT_FINISHED",
    });
  });
});
