import { describe, expect, it } from "vitest";
import { systemClock } from "../src/clock.js";

describe("the system clock", () => {
  it("runs a callback at the scheduled time unless cancelled", async () => {
    const ran: string[] = [];
    const start = systemClock.now();

    systemClock.schedule(start + 5, () => ran.push("kept"));
    const cancel = systemClock.schedule(start + 5, () => ran.push("cancelled"));
    cancel();
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(ran).toEqual(["kept"]);
    expect(systemClock.now()).toBeGreaterThanOrEqual(start + 5);
  });
});
