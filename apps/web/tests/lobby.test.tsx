import type { RoomSnapshot } from "@bowling/domain";
import { render } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { Lobby } from "../src/lobby.js";

const noop = () => {};

const room = {
  code: "K7MPQ",
  phase: "lobby",
  hostId: "ana",
  bowlers: [
    { id: "ana", nickname: "Ana", connected: true },
    { id: "bea", nickname: "Bea", connected: false },
  ],
} as RoomSnapshot;

const lobby = (you: string) =>
  render(
    <Lobby
      seat={{ you, room, receivedAt: 0 }}
      link="https://bolos.example/K7MPQ"
      onShare={noop}
      onStart={noop}
      onLeave={noop}
      onRemove={noop}
    />,
  );

describe("Lobby screen", () => {
  it("shows the Room Code and the Invite Link to share", () => {
    const html = lobby("bea");

    expect(html).toContain("K7MPQ");
    expect(html).toContain("https://bolos.example/K7MPQ");
    expect(html).toContain("Compartir invitación");
  });

  it("lists the Bowlers present, marking the Host and you", () => {
    const html = lobby("bea");

    expect(html).toMatch(/Ana.*anfitrión.*Bea.*tú/s);
  });

  it("lets only the Host start the Games", () => {
    expect(lobby("ana")).toContain("Empezar partida");
    expect(lobby("bea")).not.toContain("Empezar partida");
    expect(lobby("bea")).toContain("Esperando a que el anfitrión empiece");
  });

  it("shows who is disconnected", () => {
    expect(lobby("ana")).toMatch(/Bea.*desconectado/s);
  });

  it("lets everyone leave", () => {
    expect(lobby("bea")).toContain("Salir de la sala");
  });

  it("lets only the Host remove other Bowlers", () => {
    expect(lobby("ana")).toContain('aria-label="Quitar a Bea"');
    expect(lobby("ana")).not.toContain("Quitar a Ana");
    expect(lobby("bea")).not.toContain("Quitar a");
  });
});
