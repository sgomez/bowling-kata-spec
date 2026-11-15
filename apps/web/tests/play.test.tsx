import { render } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { Final } from "../src/final.js";
import { bowler, emptyFrames, play, room, yourFrame } from "./play-setup.js";

describe("an open Frame Window", () => {
  it("counts down and lets an unfinished Bowler Roll at the standing Pins", () => {
    const html = play("ana", room({ standing: [3, 5] }));

    expect(html).toContain("Frame 3");
    expect(html).toMatch(/Quedan.*11.*s/s);
    expect(html).toContain("input:3,5");
  });

  it("rolls the Bowler's ball in their Bowler Colour", () => {
    const html = play(
      "ana",
      room({ bowlers: [bowler("ana", { colour: 2 }), bowler("bea")] }),
    );

    expect(html).toContain("ball:#FFC53D");
  });

  it("stops the Lane when the window runs out", () => {
    expect(play("ana", room({}))).toContain("until:13300");
  });

  it("tells a Bowler whose phone has no WebGL that it can't show the Lane", () => {
    const html = play("ana", room({}), false, false, false);

    expect(html).toContain("Tu móvil no puede mostrar la pista");
    expect(html).not.toContain("input:");
  });

  it("makes a finished Bowler wait for the reveal with their own result", () => {
    const html = play("ana", yourFrame(3, ["X"], { finishedFrame: true }));

    expect(html).not.toContain("input:");
    expect(html).toMatch(
      /X.*Has terminado este frame\..*Esperando al resto….*Los resultados se revelan al cerrarse el frame\./s,
    );
  });

  it("announces the Tenth Frame's bonus Roll", () => {
    expect(play("ana", yourFrame(10, ["X", "8"]))).toContain(
      "Tirada de bonificación",
    );
    expect(play("ana", yourFrame(10, ["X"]))).not.toContain(
      "Tirada de bonificación",
    );
    expect(
      play("ana", yourFrame(10, ["X", "8", "1"], { finishedFrame: true })),
    ).not.toContain("Tirada de bonificación");
  });

  it("tells the Bowler a Roll cut short by the window did not count", () => {
    expect(play("ana", room({}), true)).toMatch(
      /role="status".*Se acabó el tiempo: esa tirada no ha contado\./s,
    );
    expect(play("ana", room({}))).not.toContain("Se acabó el tiempo");
  });
});

describe("the reveal", () => {
  it("reveals everyone's results until the next window", () => {
    const frames = emptyFrames();
    frames[0] = { rolls: ["X"], score: null };
    frames[1] = { rolls: ["7", "/"], score: 20 };
    const html = play(
      "ana",
      room({
        frame: { number: 2, open: false, remainingMs: 4_000 },
        bowlers: [bowler("ana", { frames, total: 20 }), bowler("bea")],
      }),
    );

    expect(html).toMatch(/Resultados.*Frame 2/s);
    expect(html).toMatch(/ANA.*7.*\/.*20/s);
    expect(html).toMatch(/Siguiente frame en 2 s/);
    expect(html).not.toContain("input:");
  });
});

describe("a Roll the Frame Window cut short", () => {
  it("tells the Bowler it did not count", () => {
    const frame = { number: 2, open: false, remainingMs: 4_000 } as const;

    expect(play("ana", room({ frame }), true)).toContain(
      "Se acabó el tiempo: esa tirada no ha contado.",
    );
    expect(play("ana", room({ frame }))).not.toContain("Se acabó el tiempo");
  });
});

describe("the final Scores", () => {
  const final = (winners: string[]) =>
    render(
      <Final
        seat={{
          you: "ana",
          receivedAt: 0,
          room: room({
            phase: "finished",
            winners,
            bowlers: [
              bowler("ana", { total: 87 }),
              bowler("bea", { total: 87 }),
            ],
          }),
        }}
        onRematch={() => {}}
        onLeave={() => {}}
      />,
    );

  it("names the winner", () => {
    expect(final(["ana"])).toContain("¡Gana ANA!");
    expect(final(["ana"])).toContain("87");
  });

  it("names a tie", () => {
    expect(final(["ana", "bea"])).toContain("Empate entre ANA y BEA");
  });
});
