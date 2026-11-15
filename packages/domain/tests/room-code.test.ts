import { describe, expect, it } from "vitest";
import { generateRoomCode, parseRoomCode } from "../src/room-code.js";

const sequence = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe("Room Codes", () => {
  it("are five characters drawn from an alphabet without 0, O, 1, I or L", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateRoomCode(() => false, Math.random)).toMatch(
        /^[2-9A-HJKMNP-Z]{5}$/,
      );
    }
  });

  it("map the random source onto the alphabet", () => {
    expect(generateRoomCode(() => false, sequence(0))).toBe("22222");
    expect(generateRoomCode(() => false, sequence(0.999))).toBe("ZZZZZ");
  });

  it("are regenerated when they collide with an existing Room", () => {
    const code = generateRoomCode(
      (candidate) => candidate === "22222",
      sequence(0, 0, 0, 0, 0, 0.999, 0.999, 0.999, 0.999, 0.999),
    );

    expect(code).toBe("ZZZZZ");
  });

  it("are read case-insensitively, ignoring surrounding spaces", () => {
    expect(parseRoomCode(" k7mpq ")).toBe("K7MPQ");
  });

  it.each(["K7MP", "K7MPQX", "K0MPQ", "KOMPQ", "K1MPQ", "KIMPQ", "KLMPQ", ""])(
    "reject %j",
    (input) => {
      expect(parseRoomCode(input)).toBeUndefined();
    },
  );
});
