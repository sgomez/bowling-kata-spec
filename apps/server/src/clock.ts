export interface Clock {
  now(): number;
  schedule(at: number, run: () => void): () => void;
}

export const systemClock: Clock = {
  now: () => Date.now(),
  schedule: (at, run) => {
    const timer = setTimeout(run, Math.max(0, at - Date.now()));
    return () => clearTimeout(timer);
  },
};
