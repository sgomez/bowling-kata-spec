export type PinCount = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type FrameNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface Frame {
  readonly frameNumber: FrameNumber;
  readonly rolls: readonly PinCount[];
  readonly isComplete: boolean;
  readonly cumulativeScore: number | null;
}

export const PINS_PER_RACK = 10;

export const TENTH_FRAME = 10;
