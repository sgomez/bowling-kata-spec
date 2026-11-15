import { describe, expect, it } from "vitest";
import { useServer } from "./harness.js";

const MINUTE = 60_000;

const { createRoom, time, usage, expectDestroyed } = useServer({
  absoluteMs: 8 * MINUTE,
});

describe("a Room's absolute limit", () => {
  it("destroys it counting from creation, whatever its phase", async () => {
    const { host } = await createRoom();
    time.advance(MINUTE);
    host.send({ type: "start" });
    await host.next();

    time.advance(7 * MINUTE - 1);
    expect(usage().rooms).toBe(1);
    time.advance(1);

    await expectDestroyed(host);
  });
});
