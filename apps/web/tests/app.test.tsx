import type { RoomSnapshot } from "@bowling/domain";
import { render } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { App } from "../src/app.js";
import { type ConnectionSocket, createConnection } from "../src/connection.js";

const ROOM = {
  code: "K7MPQ",
  phase: "lobby",
  hostId: "ana",
  bowlers: [{ id: "ana", nickname: "Ana", frames: [], total: 0 }],
  standing: [1, 2, 3],
  winners: ["ana"],
} as unknown as RoomSnapshot;

const connection = () => createConnection(() => ({}) as ConnectionSocket);

describe("app", () => {
  it("starts at home with the Invite Link's code", () => {
    const html = render(
      <App
        webgl
        connection={connection()}
        initialCode="K7MPQ"
        origin="https://b.es"
      />,
    );

    expect(html).toContain("Crear sala");
    expect(html).toContain("Te han invitado a la sala <strong>K7MPQ</strong>");
  });

  it("shows the last refusal in Spanish", () => {
    const s = connection();
    s.error.value = "UNKNOWN_ROOM";

    const html = render(<App webgl connection={s} initialCode="" origin="" />);

    expect(html).toContain("No existe ninguna sala con ese código.");
  });

  it("waits on the Room the Bowler is entering", () => {
    const s = connection();
    s.create("Ana");

    const html = render(<App webgl connection={s} initialCode="" origin="" />);

    expect(html).toContain("Conectando…");
  });

  it("returns home explaining the Room closed, without the old code", () => {
    const s = connection();
    s.closed.value = "ROOM_CLOSED";

    const html = render(
      <App webgl connection={s} initialCode="K7MPQ" origin="" />,
    );

    expect(html).toContain("La sala se ha cerrado.");
    expect(html).toContain("Crear sala");
    expect(html).not.toContain("K7MPQ");
  });

  it("tells the server is restarting instead of the Home", () => {
    const s = connection();
    s.closed.value = "SERVER_SHUTDOWN";

    const html = render(
      <App webgl connection={s} initialCode="K7MPQ" origin="" />,
    );

    expect(html).toContain("El servidor se está reiniciando.");
    expect(html).toContain("Volver al inicio");
    expect(html).not.toContain("Crear sala");
  });

  it("lays the reconnecting notice over the current screen", () => {
    const s = connection();
    s.seat.value = { you: "ana", room: ROOM, receivedAt: 0 };
    s.reconnecting.value = { attempt: 2, nextAt: Date.now() + 3_000 };

    const html = render(<App webgl connection={s} initialCode="" origin="" />);

    expect(html).toContain("Empezar partida");
    expect(html).toContain("Intento 2 · siguiente en 3 s");
  });

  it("drops the reconnecting notice once reconnected", () => {
    const s = connection();
    s.seat.value = { you: "ana", room: ROOM, receivedAt: 0 };

    const html = render(<App webgl connection={s} initialCode="" origin="" />);

    expect(html).not.toContain("Reconectando…");
  });

  it("moves to the Lobby once in a Room", () => {
    const s = connection();
    s.seat.value = { you: "ana", room: ROOM, receivedAt: 0 };

    const html = render(
      <App webgl connection={s} initialCode="" origin="https://b.es" />,
    );

    expect(html).toContain("https://b.es/K7MPQ");
    expect(html).toContain("Empezar partida");
  });

  it("plays the open Frame Window once started", () => {
    const s = connection();
    const frame = { number: 1, open: true, remainingMs: 30_000 } as const;
    s.seat.value = {
      you: "ana",
      room: { ...ROOM, phase: "playing", frame },
      receivedAt: 0,
    };
    s.error.value = "PIN_NOT_STANDING";

    const html = render(<App webgl connection={s} initialCode="" origin="" />);

    expect(html).toContain("Frame 1");
    expect(html).toContain("Ese bolo ya no está en pie.");
  });

  it("shows the final Scores once finished", () => {
    const s = connection();
    s.seat.value = {
      you: "ana",
      room: { ...ROOM, phase: "finished" },
      receivedAt: 0,
    };

    const html = render(<App webgl connection={s} initialCode="" origin="" />);

    expect(html).toContain("¡Gana Ana!");
  });

  it("tells a removed Bowler at home", () => {
    const s = connection();
    s.removed.value = true;

    const html = render(<App webgl connection={s} initialCode="" origin="" />);

    expect(html).toContain("El anfitrión te ha sacado de la sala.");
  });

  it("lets a Bowler leave while playing", () => {
    const s = connection();
    const frame = { number: 1, open: true, remainingMs: 30_000 } as const;
    s.seat.value = {
      you: "ana",
      room: { ...ROOM, phase: "playing", frame },
      receivedAt: 0,
    };

    const html = render(<App webgl connection={s} initialCode="" origin="" />);

    expect(html).toContain("Salir de la sala");
  });
});
