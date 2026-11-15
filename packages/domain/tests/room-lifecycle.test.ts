import { describe, expect, it } from "vitest";
import { skipFrames, startedRoom } from "./started-room.js";

describe("a Room's lifecycle for the server", () => {
  it("counts its Bowlers", () => {
    expect(startedRoom("bea", "carlos").lifecycle().bowlerCount).toBe(3);
  });

  it("tells its phase from playing to finished", () => {
    const room = startedRoom();
    expect(room.lifecycle().phase).toBe("playing");

    skipFrames(room, 10);

    expect(room.lifecycle().phase).toBe("finished");
  });
});
