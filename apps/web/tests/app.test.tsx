import type { RoomSnapshot } from "@bowling/domain";
import { render } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { App } from "../src/app.js";
import { createSession, type SessionSocket } from "../src/session.js";

const ROOM = {
  code: "K7MPQ",
  phase: "lobby",
  hostId: "ana",
  bowlers: [{ id: "ana", nickname: "Ana" }],
} as RoomSnapshot;

const session = () => createSession(() => ({}) as SessionSocket);

describe("app", () => {
  it("starts at home with the Invite Link's code", () => {
    const html = render(
      <App session={session()} initialCode="K7MPQ" origin="https://b.es" />,
    );

    expect(html).toContain("Crear sala");
    expect(html).toContain('value="K7MPQ"');
  });

  it("shows the last refusal in Spanish", () => {
    const s = session();
    s.error.value = "UNKNOWN_ROOM";

    const html = render(<App session={s} initialCode="" origin="" />);

    expect(html).toContain("No existe ninguna sala con ese código.");
  });

  it("moves to the Lobby once in a Room", () => {
    const s = session();
    s.seat.value = { you: "ana", room: ROOM };

    const html = render(
      <App session={s} initialCode="" origin="https://b.es" />,
    );

    expect(html).toContain("https://b.es/K7MPQ");
    expect(html).toContain("Empezar partida");
  });
});
