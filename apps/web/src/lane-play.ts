import type { Pin } from "@bowling/domain";
import {
  type Manner,
  observe,
  type RollRecord,
  recordRoll,
  type Staging,
  settle,
  stage,
} from "./lane-choreography.js";
import type { LaneRoll } from "./lane-physics.js";
import type { Swipe } from "./swipe.js";

// Outlives the physics: Pins keep falling after the Roll is sent.
export interface LanePlay {
  record: RollRecord;
  elapsed: number;
}

export const playRoll = (standing: readonly Pin[], swipe: Swipe): LanePlay => ({
  record: recordRoll(standing, swipe),
  elapsed: 0,
});

export const advance = (
  play: LanePlay,
  ms: number,
  roll: LaneRoll | undefined,
  manner: Manner = {},
): { staging: Staging; knocked?: Pin[] } => {
  play.elapsed += ms;
  let knocked: Pin[] | undefined;
  if (roll) {
    roll.step(ms);
    const { elapsed } = play;
    const moment = { elapsed, ball: roll.ball(), pins: roll.pins() };
    play.record = observe(play.record, moment);
    if (roll.settled) {
      knocked = roll.knocked();
      play.record = settle(play.record, knocked);
    }
  }
  return { staging: stage(play.record, play.elapsed, manner), knocked };
};
