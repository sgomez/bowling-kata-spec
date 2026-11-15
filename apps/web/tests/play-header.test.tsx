import { describe, expect, it } from "vitest";
import { play, room, yourFrame } from "./play-setup.js";

describe("the header", () => {
  it("counts the Rolls of the Bowler's own Frame", () => {
    expect(play("ana", yourFrame(3, []))).toContain("Tirada 1 de 2");
    expect(play("ana", yourFrame(3, ["7"]))).toContain("Tirada 2 de 2");
  });

  it("offers a third Roll in the Tenth Frame once a bonus Roll is earned", () => {
    expect(play("ana", yourFrame(10, ["7"]))).toContain("Tirada 2 de 2");
    expect(play("ana", yourFrame(10, ["X"]))).toContain("Tirada 2 de 3");
    expect(play("ana", yourFrame(10, ["7", "/"]))).toContain("Tirada 3 de 3");
  });

  it("says the Frame is complete once the Bowler has finished it", () => {
    const html = play("ana", yourFrame(3, ["X"], { finishedFrame: true }));

    expect(html).toContain("Frame completado");
    expect(html).not.toMatch(/Tirada \d de/);
  });

  it("shows the Rolls made so far in the Frame", () => {
    expect(play("ana", yourFrame(3, ["7"]))).toMatch(
      /<ol[^>]*aria-label="Tiradas del frame"[^>]*>.*7.*<\/ol>/s,
    );
  });

  it("turns the countdown urgent and tints the screen in the last five seconds", () => {
    const calm = play("ana", room({}));
    const urgent = play(
      "ana",
      room({ frame: { number: 3, open: true, remainingMs: 7_000 } }),
    );

    expect(urgent).toMatch(/Quedan.*5.*s/s);
    expect(urgent).toContain('class="play-edges"');
    expect(urgent).toContain('class="play-header urgent"');
    expect(calm).not.toContain("urgent");
  });

  it("maps the Pins left standing", () => {
    expect(play("ana", room({ standing: [4, 6, 10] }))).toContain(
      'aria-label="Bolos en pie: 3 de 10"',
    );
  });
});

describe("leaving the Room", () => {
  it("offers to leave from the header", () => {
    const html = play("ana", room({}));

    expect(html).toContain('aria-label="Salir de la sala"');
    expect(html).not.toContain('role="dialog"');
  });

  it("warns that the Game goes on without the Bowler for good", () => {
    const html = play("ana", room({}), false, true);

    expect(html).toMatch(
      /role="dialog".*¿Salir de la sala\?.*La partida seguirá sin ti y no podrás volver a entrar\..*Salir de la sala.*Seguir jugando/s,
    );
  });
});
