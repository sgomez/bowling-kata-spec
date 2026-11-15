import type {
  BowlerView,
  FrameView,
  RoomCode,
  RoomSnapshot,
} from "@bowling/domain";
import { render } from "preact-render-to-string";
import { Play } from "../src/play.js";
import type { RollInputProps } from "../src/roll-input.js";

export const emptyFrames = (): FrameView[] =>
  Array.from({ length: 10 }, () => ({ rolls: [], score: null }));

export const bowler = (
  id: string,
  extra: Partial<BowlerView> = {},
): BowlerView => ({
  id,
  nickname: id.toUpperCase(),
  colour: 0,
  connected: true,
  finishedFrame: false,
  frames: emptyFrames(),
  total: 0,
  ...extra,
});

export const room = (extra: Partial<RoomSnapshot>): RoomSnapshot => ({
  code: "K7MPQ" as RoomCode,
  phase: "playing",
  hostId: "ana",
  bowlers: [bowler("ana"), bowler("bea", { finishedFrame: true })],
  frame: { number: 3, open: true, remainingMs: 12_300 },
  standing: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  winners: [],
  ...extra,
});

export const yourFrame = (number: number, rolls: string[], extra = {}) => {
  const frames = emptyFrames();
  frames[number - 1] = { rolls, score: null };
  return room({
    frame: { number: number as 3, open: true, remainingMs: 12_300 },
    bowlers: [bowler("ana", { frames, ...extra }), bowler("bea")],
  });
};

const FakeInput = ({ standing, endsAt }: RollInputProps) => (
  <p>
    input:{standing.join(",")} until:{endsAt}
  </p>
);

export const play = (
  you: string,
  snapshot: RoomSnapshot,
  missed = false,
  leaving = false,
) =>
  render(
    <Play
      seat={{ you, room: snapshot, receivedAt: 1_000 }}
      frame={snapshot.frame as NonNullable<RoomSnapshot["frame"]>}
      onRoll={() => {}}
      missed={missed}
      onMiss={() => {}}
      leaving={leaving}
      onAskLeave={() => {}}
      onCancelLeave={() => {}}
      onLeave={() => {}}
      RollInput={FakeInput}
      now={() => 3_000}
    />,
  );
