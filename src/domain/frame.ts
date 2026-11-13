export interface Frame {
  readonly frameNumber: number;
  readonly rolls: readonly number[];
  readonly isComplete: boolean;
  readonly cumulativeScore: number | null;
}
