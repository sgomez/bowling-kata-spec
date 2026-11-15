import { describe, expect, it } from "vitest";
import { bowler, emptyFrames, play, room, yourFrame } from "./play-setup.js";

describe("the rival strip", () => {
  const rivals = (html: string) =>
    html.match(/<ul aria-label="Progreso de los rivales".*?<\/ul>/s)?.[0] ?? "";

  it("shows each rival's avatar and whether they have finished the Frame", () => {
    const bowlers = [bowler("ana"), bowler("bea"), bowler("cris")];
    bowlers[2] = bowler("cris", { finishedFrame: true });
    const strip = rivals(play("ana", room({ bowlers })));

    expect(strip).toMatch(/BE.*BEA.*jugando….*CR.*CRIS.*ha terminado/s);
    expect(strip).not.toContain("ANA");
  });

  it("shows who is disconnected", () => {
    const bowlers = [bowler("ana"), bowler("bea", { connected: false })];

    expect(rivals(play("ana", room({ bowlers })))).toMatch(
      /BEA.*desconectado/s,
    );
  });

  it("never shows a rival's Pins", () => {
    const frames = emptyFrames();
    frames[0] = { rolls: ["7", "2"], score: 9 };
    const bowlers = [bowler("ana"), bowler("bea", { frames, total: 9 })];

    expect(rivals(play("ana", room({ bowlers })))).not.toMatch(/7|9/);
  });
});

describe("the outcome of a Roll", () => {
  const outcome = (html: string) =>
    html.match(/<div[^>]*role="status"[^>]*>.*?<\/div>/s)?.[0] ?? "";

  it("shows nothing before the first Roll of the Frame", () => {
    expect(outcome(play("ana", yourFrame(3, [])))).toBe("");
  });

  it("celebrates a Strike", () => {
    const html = outcome(play("ana", yourFrame(10, ["X"])));

    expect(html).toMatch(/X.*¡Pleno!/s);
  });

  it("marks a Spare", () => {
    expect(outcome(play("ana", yourFrame(10, ["7", "/"])))).toMatch(
      /\/.*¡Semipleno!/s,
    );
  });

  it("names a Roll that knocked nothing", () => {
    expect(outcome(play("ana", yourFrame(3, ["-"])))).toMatch(
      /–.*Al canal.*Cero bolos/s,
    );
  });

  it("counts the Pins knocked and those left standing", () => {
    expect(outcome(play("ana", yourFrame(3, ["7"])))).toMatch(
      /7.*bolos.*Quedan 3 en pie/s,
    );
    expect(outcome(play("ana", yourFrame(3, ["1"])))).toMatch(
      /1.*bolo<.*Quedan 9 en pie/s,
    );
  });

  it("counts what is left after the second Roll of a rack", () => {
    const html = outcome(
      play("ana", yourFrame(3, ["7", "2"], { finishedFrame: true })),
    );

    expect(html).toMatch(/2.*bolos.*Queda 1 en pie/s);
    expect(outcome(play("ana", yourFrame(3, ["-", "4"])))).toMatch(
      /4.*bolos.*Quedan 6 en pie/s,
    );
  });
});
