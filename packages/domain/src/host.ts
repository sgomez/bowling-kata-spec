import type { Bowler, BowlerId } from "./bowler.js";

const following = (bowlers: readonly Bowler[], hostId: BowlerId) => {
  const at = bowlers.findIndex((b) => b.id === hostId);
  return [...bowlers.slice(at + 1), ...bowlers.slice(0, at)];
};

export const connectedHeirOf = (
  bowlers: readonly Bowler[],
  hostId: BowlerId,
): BowlerId =>
  following(bowlers, hostId).find((b) => b.connected)?.id ?? hostId;

export const heirOf = (bowlers: readonly Bowler[], hostId: BowlerId) => {
  const heir = connectedHeirOf(bowlers, hostId);
  return heir === hostId ? (following(bowlers, hostId)[0]?.id ?? hostId) : heir;
};
