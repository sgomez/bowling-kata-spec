export interface Standing<T> {
  position: number;
  bowler: T;
}

// Standard competition ranking: ties share a position (1, 2, 3, 3, 5).
export const standings = <T extends { total: number }>(
  bowlers: readonly T[],
): Standing<T>[] => {
  const ranked = [...bowlers].sort((a, b) => b.total - a.total);
  return ranked.map((bowler) => ({
    position: ranked.findIndex((b) => b.total === bowler.total) + 1,
    bowler,
  }));
};

export const leaders = <T>(ranked: readonly Standing<T>[]) =>
  ranked.filter((r) => r.position === 1).map((r) => r.bowler);
