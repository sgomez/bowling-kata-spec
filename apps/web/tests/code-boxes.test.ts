import { describe, expect, it } from "vitest";
import { typeInBox } from "../src/code-boxes.js";

describe("Room Code boxes", () => {
  it("upper-cases a typed character and moves to the next box", () => {
    expect(typeInBox("K7", 2, "m")).toEqual({ code: "K7M", focus: 3 });
  });

  it("fills every box from a pasted code", () => {
    expect(typeInBox("", 0, " k7mpq ")).toEqual({ code: "K7MPQ", focus: 4 });
  });

  it("replaces a character in the middle", () => {
    expect(typeInBox("K7MPQ", 1, "x")).toEqual({ code: "KXMPQ", focus: 2 });
  });

  it("never grows past five characters", () => {
    expect(typeInBox("K7MP", 3, "QRS")).toEqual({ code: "K7MQR", focus: 4 });
  });

  it("types at the end when a later box is tapped", () => {
    expect(typeInBox("K", 3, "7")).toEqual({ code: "K7", focus: 2 });
  });

  it("clears the last box and stays on it", () => {
    expect(typeInBox("K7MPQ", 4, "")).toEqual({ code: "K7MP", focus: 4 });
  });

  it("ignores anything but letters and digits", () => {
    expect(typeInBox("K7M", 1, "-")).toEqual({ code: "K7M", focus: 1 });
  });
});
