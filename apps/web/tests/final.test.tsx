import type { RoomSnapshot } from "@bowling/domain";
import { render } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { Final } from "../src/final.js";

const room = {
  code: "K7MPQ",
  phase: "finished",
  hostId: "ana",
  bowlers: [
    { id: "ana", nickname: "Ana", frames: [], total: 90 },
    { id: "bea", nickname: "Bea", frames: [], total: 90 },
  ],
  standing: [],
  winners: ["ana", "bea"],
} as unknown as RoomSnapshot;

const final = (you: string) =>
  render(<Final seat={{ you, room, receivedAt: 0 }} onRematch={() => {}} />);

describe("final Scores screen", () => {
  it("lets only the Host start a Rematch", () => {
    expect(final("ana")).toContain("Revancha");
    expect(final("bea")).not.toContain("Revancha");
    expect(final("bea")).toContain(
      "Esperando a que el anfitrión pida la revancha",
    );
  });
});
