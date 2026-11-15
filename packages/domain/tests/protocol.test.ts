import { describe, expect, it } from "vitest";
import { parseClientMessage } from "../src/protocol.js";

describe("client messages", () => {
  it("read a request to create a Room", () => {
    expect(
      parseClientMessage(JSON.stringify({ type: "create", nickname: "Ana" })),
    ).toEqual({ type: "create", nickname: "Ana" });
  });

  it("read a request to join a Room", () => {
    expect(
      parseClientMessage(
        JSON.stringify({ type: "join", code: "k7mpq", nickname: "Bea" }),
      ),
    ).toEqual({ type: "join", code: "k7mpq", nickname: "Bea" });
  });

  it("read the Host's request to start", () => {
    expect(parseClientMessage(JSON.stringify({ type: "start" }))).toEqual({
      type: "start",
    });
  });

  it("read a Roll as the Pins knocked", () => {
    expect(
      parseClientMessage(JSON.stringify({ type: "roll", pins: [1, 3, 10] })),
    ).toEqual({ type: "roll", pins: [1, 3, 10] });
  });

  it.each([
    ["not JSON", "{"],
    ["not an object", "42"],
    ["an unknown type", JSON.stringify({ type: "dance" })],
    ["a missing field", JSON.stringify({ type: "join", nickname: "Bea" })],
    ["a wrong field type", JSON.stringify({ type: "create", nickname: 7 })],
    [
      "an oversized nickname",
      JSON.stringify({ type: "create", nickname: "A".repeat(100) }),
    ],
    [
      "an oversized code",
      JSON.stringify({ type: "join", code: "K".repeat(100), nickname: "Bea" }),
    ],
    ["a Pin out of range", JSON.stringify({ type: "roll", pins: [0] })],
    ["a fractional Pin", JSON.stringify({ type: "roll", pins: [1.5] })],
    [
      "too many Pins",
      JSON.stringify({ type: "roll", pins: Array(11).fill(1) }),
    ],
  ])("reject %s", (_, raw) => {
    expect(parseClientMessage(raw)).toBeUndefined();
  });
});
