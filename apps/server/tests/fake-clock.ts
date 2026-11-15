import type { Clock } from "../src/clock.js";

interface Timer {
  at: number;
  run: () => void;
}

export const createFakeClock = (start = 1_000_000) => {
  let now = start;
  let timers: Timer[] = [];

  const clock: Clock = {
    now: () => now,
    schedule: (at, run) => {
      const timer = { at, run };
      timers.push(timer);
      return () => {
        timers = timers.filter((t) => t !== timer);
      };
    },
  };

  const advance = (ms: number) => {
    const until = now + ms;
    for (;;) {
      const due = timers
        .filter((t) => t.at <= until)
        .sort((a, b) => a.at - b.at)[0];
      if (!due) {
        break;
      }
      timers = timers.filter((t) => t !== due);
      now = Math.max(now, due.at);
      due.run();
    }
    now = until;
  };

  return { clock, advance, pending: () => timers.length };
};
