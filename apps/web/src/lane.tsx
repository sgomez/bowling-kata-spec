import { useEffect, useRef, useState } from "preact/hooks";
import { CelebrationOverlay } from "./celebration-overlay.js";
import { atRest } from "./lane-choreography.js";
import { canStartSwipe, checkTime, type LaneActivity } from "./lane-gate.js";
import { FOUL_LINE } from "./lane-geometry.js";
import { runLane } from "./lane-loop.js";
import type { LaneRoll } from "./lane-physics.js";
import { advance, type LanePlay, playRoll } from "./lane-play.js";
import { REST_CAMERA } from "./lane-projection.js";
import type { LaneView } from "./lane-scene.js";
import { useSwipe } from "./lane-swipe.js";
import { NO_MARKS } from "./lane-swipe-marks.js";
import type { RollInputProps } from "./roll-input.js";
import { toLane } from "./swipe.js";

const IDLE_BALL = { x: 0, y: FOUL_LINE - 0.2 };
const manner = () => ({
  reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
});

const physics = () => import("./lane-physics.js");

const samplesOf = (event: PointerEvent) => {
  const samples = event.getCoalescedEvents?.() ?? [];
  const rect = (event.currentTarget as Element).getBoundingClientRect();
  return (samples.length > 0 ? samples : [event]).flatMap(
    (e) => toLane(e, rect, REST_CAMERA) ?? [],
  );
};

export const Lane = (input: RollInputProps) => {
  const { standing } = input;
  const canvas = useRef<HTMLCanvasElement>(null);
  const props = useRef(input);
  props.current = input;
  const [timeUp, setTimeUp] = useState(false);
  const [party, setParty] = useState(false);
  const swipe = useSwipe();
  const view = useRef<LaneView>({
    ...atRest(standing, IDLE_BALL),
    marks: NO_MARKS,
  });
  const roll = useRef<LaneRoll | undefined>(undefined);
  const play = useRef<LanePlay | undefined>(undefined);
  const resting = useRef(standing);
  const activity = (): LaneActivity =>
    roll.current ? "rolling" : swipe.aiming() ? "aiming" : "idle";
  const frameTime = () => ({
    now: props.current.now(),
    endsAt: props.current.endsAt,
  });
  const rest = () => {
    if (play.current) props.current.onPlayed();
    play.current = undefined;
    setParty(false);
    view.current = { ...view.current, ...atRest(resting.current, IDLE_BALL) };
  };

  useEffect(() => {
    resting.current = standing;
    if (activity() === "idle" && !play.current) rest();
  }, [standing]);

  useEffect(() => {
    physics();
    let last = performance.now();
    const expire = () => {
      const time = checkTime(activity(), frameTime());
      if (time === "running") return;
      setTimeUp(true);
      if (time === "over") return;
      roll.current = undefined;
      cancel();
      props.current.onMiss();
    };
    const frame = (now: number) => {
      expire();
      if (play.current) {
        const { staging, knocked } = advance(
          play.current,
          now - last,
          roll.current,
          manner(),
        );
        view.current = { ...view.current, ...staging };
        setParty(staging.celebration?.confetti ?? false);
        if (knocked) {
          roll.current = undefined;
          resting.current = resting.current.filter((p) => !knocked.includes(p));
          props.current.onRoll(knocked);
        }
        if (staging.done) rest();
      }
      last = now;
      view.current.marks = swipe.marks(now);
      return view.current;
    };
    const stop = runLane(
      canvas.current as HTMLCanvasElement,
      props.current.ball,
      frame,
    );
    return () => {
      stop();
      if (play.current) props.current.onPlayed();
      if (roll.current) props.current.onMiss();
    };
  }, []);

  const onPointerDown = (event: PointerEvent) => {
    const target = event.currentTarget as Element;
    const [start] = samplesOf(event);
    if (props.current.finished) return;
    if (!start || !canStartSwipe(activity(), frameTime(), start)) return;
    target.setPointerCapture(event.pointerId);
    swipe.start(start);
    rest();
    view.current.ball = { ...view.current.ball, ...start };
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!swipe.aiming()) return;
    const ball = swipe.extend(samplesOf(event));
    view.current.ball = { ...view.current.ball, ...ball };
  };

  const cancel = () => {
    swipe.drop();
    rest();
  };

  const onPointerUp = async () => {
    if (!swipe.aiming()) return;
    const reading = swipe.release();
    rest();
    if (!reading) return;
    const { startRoll } = await physics();
    roll.current = startRoll(props.current.standing, reading);
    play.current = playRoll(props.current.standing, reading);
  };

  return (
    <div class="lane">
      <canvas
        ref={canvas}
        aria-label="Pista"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={cancel}
      />
      {swipe.overlay(timeUp)}
      {party && <CelebrationOverlay />}
      {timeUp && <p>Se acabó el tiempo.</p>}
    </div>
  );
};
