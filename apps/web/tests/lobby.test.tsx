import type { BowlerView, RoomSnapshot } from "@bowling/domain";
import { render } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { Lobby } from "../src/lobby.js";

const noop = () => {};

const bowler = (
  id: string,
  nickname: string,
  colour: number,
  connected = true,
) => ({ id, nickname, colour, connected }) as BowlerView;

const ANA = bowler("ana", "Ana", 0);
const BEA = bowler("bea", "Bea", 1, false);

const roomOf = (...bowlers: BowlerView[]) =>
  ({ code: "K7MPQ", phase: "lobby", hostId: "ana", bowlers }) as RoomSnapshot;

const lobby = (
  you: string,
  extra: Partial<Parameters<typeof Lobby>[0]> = {},
  room = roomOf(ANA, BEA),
) =>
  render(
    <Lobby
      seat={{ you, room, receivedAt: 0 }}
      link="https://bolos.example/K7MPQ"
      onShare={noop}
      onStart={noop}
      onLeave={noop}
      onAskRemove={noop}
      onCancelRemove={noop}
      onRemove={noop}
      now={() => 1_000}
      {...extra}
    />,
  );

const count = (html: string, text: string) => html.split(text).length - 1;

describe("Lobby screen", () => {
  it("shows the Room Code and the Invite Link to share", () => {
    const html = lobby("bea");

    expect(html).toContain("K7MPQ");
    expect(html).toContain("https://bolos.example/K7MPQ");
    expect(html).toContain("Compartir invitación");
  });

  it("lists the Bowlers with their avatars, marking the Host and you", () => {
    const html = lobby("bea");

    expect(html).toMatch(/>AN<.*Ana.*anfitrión.*>BE<.*Bea.*tú/s);
    expect(html).toContain("Jugadores (2/6)");
  });

  it("shows who is disconnected", () => {
    expect(lobby("ana")).toMatch(/Bea.*desconectado/s);
  });

  it("shows the free seats up to six", () => {
    expect(count(lobby("ana"), "Hueco libre")).toBe(4);
    expect(lobby("ana")).not.toContain("sala completa");
  });

  it("marks a Room of six as full, with no free seats", () => {
    const six = roomOf(
      ANA,
      BEA,
      bowler("c", "Carmen", 2),
      bowler("d", "Dani", 3),
      bowler("e", "Eva", 4),
      bowler("f", "Fran", 5),
    );

    const html = lobby("ana", {}, six);

    expect(html).toContain("sala completa");
    expect(html).toContain("Jugadores (6/6)");
    expect(html).not.toContain("Hueco libre");
  });

  it("lets only the Host start the Games", () => {
    expect(lobby("ana")).toContain("Empezar partida");
    expect(lobby("bea")).not.toContain("Empezar partida");
    expect(lobby("bea")).toContain("Esperando a que el anfitrión empiece…");
  });

  it("lets everyone leave", () => {
    expect(lobby("bea")).toContain("Salir de la sala");
  });

  it("lets only the Host remove other Bowlers", () => {
    expect(lobby("ana")).toContain('aria-label="Quitar a Bea"');
    expect(lobby("ana")).not.toContain("Quitar a Ana");
    expect(lobby("bea")).not.toContain("Quitar a");
  });

  it("asks the Host to confirm before removing a Bowler", () => {
    expect(lobby("ana")).not.toContain('role="dialog"');

    const html = lobby("ana", { removing: "bea" });

    expect(html).toContain('role="dialog"');
    expect(html).toContain("¿Quitar a Bea de la sala?");
    expect(html).toMatch(/role="dialog".*>Quitar<.*>Cancelar</s);
  });

  it("drops the confirmation once that Bowler has gone", () => {
    const html = lobby("ana", { removing: "bea" }, roomOf(ANA));

    expect(html).not.toContain('role="dialog"');
  });

  it("tells the Bowler the Invite Link was copied", () => {
    expect(lobby("bea", { shared: { outcome: "copied", at: 1_000 } })).toMatch(
      /role="status".*Enlace copiado\./s,
    );
    expect(
      lobby("bea", { shared: { outcome: "failed", at: 1_000 } }),
    ).toContain("No se ha podido compartir; copia el enlace a mano.");
    expect(
      lobby("bea", { shared: { outcome: "shared", at: 1_000 } }),
    ).not.toContain('role="status"');
  });

  it("shows a refusal as an alert", () => {
    expect(
      lobby("bea", { error: "Solo el anfitrión puede hacer eso." }),
    ).toMatch(/role="alert".*Solo el anfitrión puede hacer eso\./s);
  });
});
