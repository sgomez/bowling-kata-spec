import { type FrameNumber, frameWindowMs, type Pin } from "@bowling/domain";
import { secondsLeft, useTick } from "./countdown.js";
import { rollsOfFrame } from "./frame-progress.js";
import { LEAVE } from "./icons.js";
import { PinMap } from "./pin-map.js";
import { Icon } from "./ui.js";

const URGENT_SECONDS = 5;
const SLOTS = ["first", "second", "third"];

interface PlayHeaderProps {
  frame: FrameNumber;
  rolls: readonly string[];
  finished: boolean;
  standing: readonly Pin[];
  endsAt: number;
  now: () => number;
  onAskLeave: () => void;
}

export const PlayHeader = ({
  frame,
  rolls,
  finished,
  standing,
  endsAt,
  now,
  onAskLeave,
}: PlayHeaderProps) => {
  useTick();
  const { next, of } = rollsOfFrame(frame, rolls);
  const boxes = finished ? rolls.length : of;
  const seconds = secondsLeft(endsAt, now);
  const left = Math.max(0, endsAt - now()) / frameWindowMs(frame);
  const urgent = seconds <= URGENT_SECONDS;

  return (
    <header class={urgent ? "play-header urgent" : "play-header"}>
      {urgent && <div aria-hidden="true" class="play-edges" />}
      <button
        type="button"
        class="play-leave"
        aria-label="Salir de la sala"
        onClick={onAskLeave}
      >
        <Icon d={LEAVE} />
      </button>
      <div class="play-where">
        <h1>Frame {frame}</h1>
        <div class="play-rolls">
          <ol aria-label="Tiradas del frame">
            {SLOTS.slice(0, boxes).map((slot, i) => (
              <li key={slot} class={rolls[i] ? "made" : "pending"}>
                {rolls[i]}
              </li>
            ))}
          </ol>
          <span>
            {finished ? "Frame completado" : `Tirada ${next} de ${of}`}
          </span>
        </div>
      </div>
      <PinMap standing={standing} />
      <div class="play-clock">
        <span class="play-clock-label">Quedan</span>
        <span role="timer" class="play-seconds">
          <span key={seconds} class="play-tick">
            {seconds}
          </span>
          <small> s</small>
        </span>
      </div>
      <div aria-hidden="true" class="play-bar">
        <div style={{ width: `${left * 100}%` }} />
      </div>
    </header>
  );
};
