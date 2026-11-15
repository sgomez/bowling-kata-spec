import type { RoomSnapshot } from "@bowling/domain";
import { describe, expect, it } from "vitest";
import { type Client, useServer } from "./harness.js";

const { connect, createRoom, joinRoom, time } = useServer();

const STRIKE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const snapshot = async (client: Client): Promise<RoomSnapshot> => {
  const message = await client.next();
  if (message.type !== "room") {
    throw new Error(message.type);
  }
  return message.room;
};

const startGames = async () => {
  const { host: ana, code } = await createRoom();
  const bea = await joinRoom(code, "Bea");
  await ana.next();
  ana.send({ type: "start" });
  await snapshot(ana);
  await snapshot(bea);
  return { ana, bea };
};

describe("playing a Room", () => {
  it("opens a 30 s Frame Window when the Host starts", async () => {
    const { host } = await createRoom();

    host.send({ type: "start" });

    expect((await snapshot(host)).frame).toEqual({
      number: 1,
      open: true,
      remainingMs: 30_000,
    });
  });

  it("tells everyone who has finished, hiding their Rolls", async () => {
    const { ana, bea } = await startGames();

    bea.send({ type: "roll", pins: STRIKE });

    expect((await snapshot(bea)).bowlers[1].frames[0].rolls).toEqual(["X"]);
    expect((await snapshot(ana)).bowlers[1]).toMatchObject({
      finishedFrame: true,
      frames: expect.arrayContaining([{ rolls: [], score: null }]),
    });
  });

  it("refuses a Pin that is not standing", async () => {
    const { ana, bea } = await startGames();
    ana.send({ type: "roll", pins: [1] });
    await snapshot(ana);
    await snapshot(bea);

    ana.send({ type: "roll", pins: [1] });

    expect(await ana.next()).toEqual({
      type: "error",
      error: "PIN_NOT_STANDING",
    });
  });

  it("refuses a Roll from outside a Room", async () => {
    const stranger = await connect();

    stranger.send({ type: "roll", pins: [1] });

    expect(await stranger.next()).toEqual({
      type: "error",
      error: "NOT_IN_ROOM",
    });
  });

  it("closes the window at its deadline, counting missing Rolls as zero", async () => {
    const { ana, bea } = await startGames();

    time.advance(30_499);
    ana.send({ type: "roll", pins: [1] });
    await snapshot(ana);
    await snapshot(bea);
    time.advance(1);

    const revealed = await snapshot(bea);
    expect(revealed.frame).toEqual({
      number: 1,
      open: false,
      remainingMs: 5_000,
    });
    expect(revealed.bowlers.map((b) => b.frames[0].rolls)).toEqual([
      ["1", "-"],
      ["-", "-"],
    ]);
  });

  it("closes early once every connected Bowler has finished", async () => {
    const { ana, bea } = await startGames();
    bea.close();
    await snapshot(ana);

    ana.send({ type: "roll", pins: STRIKE });

    expect((await snapshot(ana)).frame?.open).toBe(false);
    time.advance(5_000);
    expect((await snapshot(ana)).frame).toEqual({
      number: 2,
      open: true,
      remainingMs: 30_000,
    });
  });

  it("finishes after the Tenth Frame with the winner", async () => {
    const { ana, bea } = await startGames();
    ana.send({ type: "roll", pins: [1] });
    await snapshot(ana);
    await snapshot(bea);

    time.advance(9 * 35_500 + 45_500);

    let final = await snapshot(bea);
    while (final.phase !== "finished") {
      final = await snapshot(bea);
    }
    expect(final.bowlers.map((b) => b.total)).toEqual([1, 0]);
    expect(final.winners).toEqual([final.bowlers[0].id]);
    expect(time.pending()).toBe(0);
  });
});
