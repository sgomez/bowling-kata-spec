import type { FrameNumber, PinCount } from "./frame.js";
import { buildFrames } from "./frames.js";
import { Game } from "./game.js";
import { notation } from "./notation.js";
import { PINS, type Pin } from "./pins.js";

export type BowlerId = string;

export interface Bowler {
  readonly id: BowlerId;
  readonly nickname: string;
  connected: boolean;
  game: Game;
  standing: Set<Pin>;
}

export interface FrameView {
  rolls: string[];
  score: number | null;
}

export interface BowlerView {
  id: BowlerId;
  nickname: string;
  connected: boolean;
  finishedFrame: boolean;
  frames: FrameView[];
  total: number;
}

const fullRack = () => new Set(PINS);

export const newBowler = (id: BowlerId, nickname: string): Bowler => ({
  id,
  nickname,
  connected: true,
  game: new Game(),
  standing: fullRack(),
});

export const hasFinished = (bowler: Bowler, frame: FrameNumber) =>
  bowler.game.isComplete() || bowler.game.currentFrame > frame;

export const allStanding = (bowler: Bowler, pins: readonly Pin[]) =>
  pins.every((pin) => bowler.standing.has(pin));

export const knock = (bowler: Bowler, pins: readonly Pin[]) => {
  const knocked = new Set(pins);
  bowler.game.roll(knocked.size as PinCount);
  bowler.standing = bowler.game.isFreshRack
    ? fullRack()
    : new Set([...bowler.standing].filter((pin) => !knocked.has(pin)));
};

export const fillFrame = (bowler: Bowler, frame: FrameNumber) => {
  while (!hasFinished(bowler, frame)) {
    knock(bowler, []);
  }
};

const totalOf = (frames: FrameView[]) =>
  Math.max(0, ...frames.map((frame) => frame.score ?? 0));

export const bowlerView = (
  bowler: Bowler,
  frame: FrameNumber | undefined,
  hideFrame: boolean,
): BowlerView => {
  const played = bowler.game.frames;
  const visible = hideFrame
    ? buildFrames(
        played
          .filter((f) => f.frameNumber < (frame as number))
          .flatMap((f) => f.rolls),
      )
    : played;
  const frames = visible.map((f) => ({
    rolls: notation(f),
    score: f.cumulativeScore,
  }));
  return {
    id: bowler.id,
    nickname: bowler.nickname,
    connected: bowler.connected,
    finishedFrame: frame !== undefined && hasFinished(bowler, frame),
    frames,
    total: totalOf(frames),
  };
};
