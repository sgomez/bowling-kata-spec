import {
  type Bowler,
  type BowlerId,
  type BowlerView,
  bowlerView,
} from "./bowler.js";
import type { FrameNumber } from "./frame.js";
import { type FrameWindow, windowView } from "./frame-window.js";
import type { Pin } from "./pins.js";
import type { RoomCode } from "./room-code.js";

export type Phase = "lobby" | "playing" | "finished";

export interface RoomSnapshot {
  code: RoomCode;
  phase: Phase;
  hostId: BowlerId;
  bowlers: BowlerView[];
  frame?: { number: FrameNumber; open: boolean; remainingMs: number };
  standing: Pin[];
  winners: BowlerId[];
}

interface RoomState {
  code: RoomCode;
  phase: Phase;
  hostId: BowlerId;
  bowlers: readonly Bowler[];
  window: FrameWindow | undefined;
  viewer: BowlerId;
  now: number;
}

const winnersOf = (bowlers: BowlerView[]) => {
  const best = Math.max(...bowlers.map((b) => b.total));
  return bowlers.filter((b) => b.total === best).map((b) => b.id);
};

export const roomSnapshot = ({
  code,
  phase,
  hostId,
  bowlers,
  window,
  viewer,
  now,
}: RoomState): RoomSnapshot => {
  const views = bowlers.map((bowler) =>
    bowlerView(
      bowler,
      window?.frame,
      window?.open === true && bowler.id !== viewer,
    ),
  );
  const you = bowlers.find((b) => b.id === viewer);
  return {
    code,
    phase,
    hostId,
    bowlers: views,
    ...(window && { frame: windowView(window, now) }),
    standing: you ? [...you.standing].sort((a, b) => a - b) : [],
    winners: phase === "finished" ? winnersOf(views) : [],
  };
};
