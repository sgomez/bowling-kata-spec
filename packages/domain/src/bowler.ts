import type { FrameNumber, PinCount } from "./frame.js";
import { buildFrames } from "./frames.js";
import { Game } from "./game.js";
import { FOUL, notation } from "./notation.js";
import { PINS, type Pin } from "./pins.js";

export type BowlerId = string;

export type BowlerColour = 0 | 1 | 2 | 3 | 4 | 5;

export interface Newcomer {
  id: BowlerId;
  nickname: string;
}

export interface Bowler {
  readonly id: BowlerId;
  readonly nickname: string;
  readonly colour: BowlerColour;
  connected: boolean;
  game: Game;
  standing: Set<Pin>;
  // "frame:roll" of each Foul; the Game itself only sees zero Pins.
  fouls: Set<string>;
}

export interface FrameView {
  rolls: string[];
  score: number | null;
}

export interface BowlerView {
  id: BowlerId;
  nickname: string;
  colour: BowlerColour;
  connected: boolean;
  finishedFrame: boolean;
  frames: FrameView[];
  total: number;
}

const fullRack = () => new Set(PINS);

export const newBowler = (
  id: BowlerId,
  nickname: string,
  colour: BowlerColour,
): Bowler => ({
  id,
  nickname,
  colour,
  connected: true,
  game: new Game(),
  standing: fullRack(),
  fouls: new Set(),
});

export const resetGame = (bowler: Bowler) => {
  bowler.game = new Game();
  bowler.standing = fullRack();
  bowler.fouls = new Set();
};

const hasFinished = (bowler: Bowler, frame: FrameNumber) =>
  bowler.game.isComplete() || bowler.game.currentFrame > frame;

export const everyoneFinished = (
  bowlers: readonly Bowler[],
  frame: FrameNumber,
) => {
  const connected = bowlers.filter((b) => b.connected);
  return connected.length > 0 && connected.every((b) => hasFinished(b, frame));
};

export const rollRefusal = (
  bowler: Bowler,
  frame: FrameNumber,
  pins: readonly Pin[],
) => {
  if (hasFinished(bowler, frame)) return "FRAME_FINISHED";
  if (!pins.every((pin) => bowler.standing.has(pin))) return "PIN_NOT_STANDING";
  return undefined;
};

// Pins knocked on a Foul don't count.
export const knock = (bowler: Bowler, pins: readonly Pin[], foul = false) => {
  const { game } = bowler;
  if (foul) bowler.fouls.add(`${game.currentFrame}:${game.currentRoll}`);
  const knocked = new Set(foul ? [] : pins);
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
    rolls: notation(f).map((mark, i) =>
      bowler.fouls.has(`${f.frameNumber}:${i + 1}`) ? FOUL : mark,
    ),
    score: f.cumulativeScore,
  }));
  return {
    id: bowler.id,
    nickname: bowler.nickname,
    colour: bowler.colour,
    connected: bowler.connected,
    finishedFrame: frame !== undefined && hasFinished(bowler, frame),
    frames,
    total: totalOf(frames),
  };
};
