import { useEffect, useState } from "preact/hooks";

export const useTick = () => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((tick) => tick + 1), 250);
    return () => clearInterval(timer);
  }, []);
};

export const secondsLeft = (endsAt: number, now: () => number) =>
  Math.max(0, Math.ceil((endsAt - now()) / 1000));
