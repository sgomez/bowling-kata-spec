import { describe, expect, it } from "vitest";
import { readServerConfig } from "../src/config.js";

describe("server config", () => {
  it("listens on port 3000 by default", () => {
    expect(readServerConfig({}).port).toBe(3000);
  });

  it("listens on the port given by PORT", () => {
    expect(readServerConfig({ PORT: "8787" }).port).toBe(8787);
  });
});
