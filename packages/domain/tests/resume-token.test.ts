import { describe, expect, it } from "vitest";
import { issueResumeToken, roomOfResumeToken } from "../src/resume-token.js";
import { parseRoomCode, type RoomCode } from "../src/room-code.js";

const code = parseRoomCode("K7MPQ") as RoomCode;

describe("Resume tokens", () => {
  it("carry the Room Code they were issued for", () => {
    expect(roomOfResumeToken(issueResumeToken(code, "abc"))).toBe("K7MPQ");
  });

  it("differ by their random part", () => {
    expect(issueResumeToken(code, "a")).not.toBe(issueResumeToken(code, "b"));
  });

  it.each(["", "abc", "K7MP.abc", ".K7MPQ"])(
    "name no Room when malformed: %j",
    (token) => {
      expect(roomOfResumeToken(token)).toBeUndefined();
    },
  );
});
