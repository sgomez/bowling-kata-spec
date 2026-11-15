import type {
  BowlerView,
  FrameView,
  RoomCode,
  RoomSnapshot,
} from "@bowling/domain";
import { render } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { Final } from "../src/final.js";
import { Play } from "../src/play.js";
import type { RollInputProps } from "../src/roll-input.js";

const emptyFrames = (): FrameView[] =>
  Array.from({ length: 10 }, () => ({ rolls: [], score: null }));

const bowler = (id: string, extra: Partial<BowlerView> = {}): BowlerView => ({
  id,
  nickname: id.toUpperCase(),
  connected: true,
  finishedFrame: false,
  frames: emptyFrames(),
  total: 0,
  ...extra,
});

const room = (extra: Partial<RoomSnapshot>): RoomSnapshot => ({
  code: "K7MPQ" as RoomCode,
  phase: "playing",
  hostId: "ana",
  bowlers: [bowler("ana"), bowler("bea", { finishedFrame: true })],
  frame: { number: 3, open: true, remainingMs: 12_300 },
  standing: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  winners: [],
  ...extra,
});

const FakeInput = ({ standing }: RollInputProps) => (
  <p>input:{standing.join(",")}</p>
);

const play = (you: string, snapshot: RoomSnapshot) =>
  render(
    <Play
      seat={{ you, room: snapshot, receivedAt: 1_000 }}
      frame={snapshot.frame as NonNullable<RoomSnapshot["frame"]>}
      onRoll={() => {}}
      RollInput={FakeInput}
      now={() => 3_000}
    />,
  );

describe("an open Frame Window", () => {
  it("counts down and lets an unfinished Bowler Roll at the standing Pins", () => {
    const html = play("ana", room({ standing: [3, 5] }));

    expect(html).toContain("Frame 3");
    expect(html).toMatch(/Quedan.*11.*s/s);
    expect(html).toContain("input:3,5");
  });

  it("shows who has finished the Frame", () => {
    expect(play("ana", room({}))).toMatch(/ANA.*jugando.*BEA.*ha terminado/s);
  });

  it("shows who is disconnected", () => {
    const bowlers = [bowler("ana"), bowler("bea", { connected: false })];

    expect(play("ana", room({ bowlers }))).toMatch(/BEA.*desconectado/s);
  });

  it("makes a finished Bowler wait for the rest", () => {
    const html = play("bea", room({}));

    expect(html).not.toContain("input:");
    expect(html).toContain("Esperando al resto");
  });
});

describe("the reveal", () => {
  it("shows everyone's scorecard until the next window", () => {
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

    expect(html).toMatch(/ANA.*X.*7 \/.*20/s);
    expect(html).toMatch(/Siguiente frame en.*2.*s/s);
    expect(html).not.toContain("input:");
  });
});

describe("the final Scores", () => {
  const final = (winners: string[]) =>
    render(
      <Final
        room={room({
          phase: "finished",
          winners,
          bowlers: [bowler("ana", { total: 87 }), bowler("bea", { total: 87 })],
        })}
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
