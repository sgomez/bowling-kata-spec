import { describe, expect, it } from "vitest";
import { readServerConfig } from "../src/config.js";

describe("server config", () => {
  it("listens on port 8787 by default", () => {
    expect(readServerConfig({}).port).toBe(8787);
  });

  it("listens on the port given by PORT", () => {
    expect(readServerConfig({ PORT: "3000" }).port).toBe(3000);
  });
});
