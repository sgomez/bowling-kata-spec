import { describe, expect, it, vi } from "vitest";
import { useServer } from "./harness.js";

const MINUTE = 60_000;

const { createRoom, joinRoom, time, usage, expectDestroyed } = useServer();

const lobby = async () => {
  const { host: ana, code } = await createRoom();
  const bea = await joinRoom(code, "Bea");
  await ana.next();
  return { ana, bea };
};

const startGames = async (afterMs = 0) => {
  const { ana, bea } = await lobby();
  time.advance(afterMs);
  ana.send({ type: "start" });
  await ana.next();
  await bea.next();
  return { ana, bea };
};

describe("a Room is destroyed", () => {
  it("when its Lobby isn't started within 15 min", async () => {
    const { ana, bea } = await lobby();

    time.advance(15 * MINUTE - 1);
    expect(usage().rooms).toBe(1);
    time.advance(1);

    await expectDestroyed(ana, bea);
  });

  it("when all its Bowlers stay disconnected for 2 min", async () => {
    const { ana, bea } = await startGames();
    bea.close();
    await ana.next();
    ana.close();
    await vi.waitFor(() => expect(usage().connections).toBe(0));

    time.advance(2 * MINUTE - 1);
    expect(usage().rooms).toBe(1);
    time.advance(1);

    await expectDestroyed();
  });

  it("5 min after its Games finish", async () => {
    const { ana, bea } = await startGames();

    time.advance(9 * 35_500 + 45_500 + 5 * MINUTE - 1);
    expect(usage().rooms).toBe(1);
    time.advance(1);

    await expectDestroyed(ana, bea);
  });
});

describe("a Room is kept", () => {
  it("past 15 min once its Games started", async () => {
    await startGames(14 * MINUTE);

    time.advance(2 * MINUTE);

    expect(usage().rooms).toBe(1);
  });

  it("while any Bowler stays connected", async () => {
    const { ana, bea } = await startGames();
    bea.close();
    await ana.next();

    time.advance(2 * MINUTE);

    expect(usage().rooms).toBe(1);
  });
});
