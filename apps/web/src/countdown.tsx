import { useEffect, useState } from "preact/hooks";

interface CountdownProps {
  endsAt: number;
  now: () => number;
}

export const Countdown = ({ endsAt, now }: CountdownProps) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((tick) => tick + 1), 250);
    return () => clearInterval(timer);
  }, []);

  const seconds = Math.max(0, Math.ceil((endsAt - now()) / 1000));
  return <span role="timer">{seconds} s</span>;
};
