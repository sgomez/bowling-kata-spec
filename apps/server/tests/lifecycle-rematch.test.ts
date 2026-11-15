import { describe, expect, it } from "vitest";
import { type Client, useServer } from "./harness.js";

const MINUTE = 60_000;
const GAMES_MS = 9 * 35_500 + 45_500;

const { createRoom, time, usage, expectDestroyed } = useServer({
  absoluteMs: 14 * MINUTE,
});

const untilPhase = async (client: Client, phase: string) => {
  let message = await client.next();
  while (message.type !== "room" || message.room.phase !== phase) {
    message = await client.next();
  }
};

const rematchAfter = async (finishedMs: number) => {
  const { host } = await createRoom();
  host.send({ type: "start" });
  await host.next();
  time.advance(GAMES_MS);
  await untilPhase(host, "finished");
  time.advance(finishedMs);
  host.send({ type: "rematch" });
  await untilPhase(host, "playing");
  return host;
};

describe("a Rematch", () => {
  it("cancels the finished-Room limit", async () => {
    await rematchAfter(4 * MINUTE);

    time.advance(2 * MINUTE);

    expect(usage().rooms).toBe(1);
  });

  it("keeps the absolute limit from creation", async () => {
    const host = await rematchAfter(4 * MINUTE);

    time.advance(14 * MINUTE - GAMES_MS - 4 * MINUTE - 1);
    expect(usage().rooms).toBe(1);
    time.advance(1);

    await expectDestroyed(host);
  });
});
