import type { Pin } from "@bowling/domain";
import {
  type Manner,
  observe,
  type RollTrack,
  type Staging,
  settle,
  stage,
  trackRoll,
} from "./lane-choreography.js";
import type { LaneRoll } from "./lane-physics.js";
import type { Swipe } from "./swipe.js";

// Outlives the physics: Pins keep falling after the Roll is sent.
export interface LanePlay {
  track: RollTrack;
  elapsed: number;
}

export const playRoll = (standing: readonly Pin[], swipe: Swipe): LanePlay => ({
  track: trackRoll(standing, swipe),
  elapsed: 0,
});

// Steps the physics, if still rolling; `knocked` is set on the frame it settles.
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
    play.track = observe(play.track, moment);
    if (roll.settled) {
      knocked = roll.knocked();
      play.track = settle(play.track, knocked);
    }
  }
  return { staging: stage(play.track, play.elapsed, manner), knocked };
};
