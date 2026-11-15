import type { BowlerView, FrameView } from "@bowling/domain";
import { render } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { Reveal } from "../src/reveal.js";

const framesWith = (...played: FrameView[]): FrameView[] =>
  Array.from({ length: 10 }, (_, i) => played[i] ?? { rolls: [], score: null });

const bowler = (
  nickname: string,
  total: number,
  frames = framesWith({ rolls: ["5", "2"], score: total }),
): BowlerView => ({
  id: nickname.toLowerCase(),
  nickname,
  colour: 0,
  connected: true,
  finishedFrame: true,
  frames,
  total,
});

const reveal = (bowlers: BowlerView[], you = "luis") =>
  render(
    <Reveal
      you={you}
      bowlers={bowlers}
      frame={1}
      endsAt={6_000}
      now={() => 1_500}
      onAskLeave={() => {}}
    />,
  );

const text = (html: string) => html.replace(/<[^>]*>/g, " ");

describe("the reveal between Frames", () => {
  it("titles the results of the Frame that closed", () => {
    expect(reveal([bowler("Luis", 7)])).toMatch(/Resultados.*Frame 1/s);
  });

  it("ranks Bowlers by total with their position, avatar and total", () => {
    const html = text(
      reveal([bowler("Luis", 7), bowler("Marta", 9), bowler("Nuria", 3)]),
    );

    expect(html).toMatch(
      /1\s+MA\s+Marta.*9.*2\s+LU\s+Luis.*7.*3\s+NU\s+Nuria/s,
    );
  });

  it("lets tied Bowlers share a position", () => {
    const html = text(
      reveal([bowler("Luis", 7), bowler("Marta", 9), bowler("Nuria", 7)]),
    );

    expect(html).toMatch(/1\s+MA.*2\s+LU.*2\s+NU/s);
  });

  it("flips each Bowler's Rolls of the Frame", () => {
    const strike = framesWith({ rolls: ["X"], score: null });
    const html = reveal([bowler("Luis", 0, strike), bowler("Marta", 7)]);

    expect(html).toMatch(/class="roll[^"]*"[^>]*>X</);
    expect(html).toMatch(
      /class="roll[^"]*"[^>]*>5<.*class="roll[^"]*"[^>]*>2</s,
    );
  });

  it("says who leads", () => {
    expect(text(reveal([bowler("Luis", 7), bowler("Marta", 9)]))).toContain(
      "Marta va en cabeza",
    );
  });

  it("names every leader on a tie", () => {
    const html = text(
      reveal([bowler("Luis", 9), bowler("Marta", 9), bowler("Nuria", 2)]),
    );

    expect(html).toContain("Luis y Marta van en cabeza");
  });

  it("marks Bowlers whose bonus Rolls are pending", () => {
    const spare = framesWith({ rolls: ["7", "/"], score: null });
    const html = text(
      reveal([bowler("Luis", 0, spare), bowler("Marta", 7)], "nuria"),
    );

    expect(html).toMatch(/Luis\s+\+ bonificación pendiente/);
    expect(html).not.toMatch(/Marta\s+\+ bonificación pendiente/);
  });

  it("marks the viewer", () => {
    expect(text(reveal([bowler("Luis", 7), bowler("Marta", 9)]))).toMatch(
      /Luis\s+tú/,
    );
  });

  it("counts down to the next Frame and offers the full scorecard", () => {
    const html = text(reveal([bowler("Luis", 7)]));

    expect(html).toMatch(/Siguiente frame en\s+5 s/);
    expect(html).toContain("Ver marcador completo");
    expect(html).not.toContain(`role="dialog"`);
  });
});
