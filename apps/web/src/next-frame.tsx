import { useState } from "preact/hooks";
import { secondsLeft, useTick } from "./countdown.js";

const RING_MS = 5000;

interface NextFrameProps {
  endsAt: number;
  now: () => number;
}

export const NextFrame = ({ endsAt, now }: NextFrameProps) => {
  useTick();
  // Frozen at mount so re-renders don't move the ring.
  const [drained] = useState(() =>
    Math.min(RING_MS, Math.max(0, RING_MS - (endsAt - now()))),
  );
  const seconds = secondsLeft(endsAt, now);
  return (
    <div class="next-frame">
      <svg aria-hidden="true" width="44" height="44" viewBox="0 0 44 44">
        <circle class="ring-track" cx="22" cy="22" r="19" />
        <circle
          class="ring"
          cx="22"
          cy="22"
          r="19"
          style={{ animationDelay: `${-drained}ms` }}
        />
        <text x="22" y="28" text-anchor="middle">
          {seconds}
        </text>
      </svg>
      <span role="timer">Siguiente frame en {seconds} s</span>
    </div>
  );
};
