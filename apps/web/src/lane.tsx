import { useEffect, useRef, useState } from "preact/hooks";
import { rack } from "./knock.js";
import { canStartSwipe, checkTime, type LaneActivity } from "./lane-gate.js";
import { FOUL_LINE } from "./lane-geometry.js";
import type { LaneRoll } from "./lane-physics.js";
import { REST_CAMERA } from "./lane-projection.js";
import type { LaneScene, LaneView } from "./lane-scene.js";
import { useSwipe } from "./lane-swipe.js";
import { NO_MARKS } from "./lane-swipe-marks.js";
import type { RollInputProps } from "./roll-input.js";
import { toLane } from "./swipe.js";

const IDLE_BALL = { x: 0, y: FOUL_LINE / 2 };

const physics = () => import("./lane-physics.js");
const scenery = () => import("./lane-scene.js");

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
  const swipe = useSwipe();
  const view = useRef<LaneView>({
    pins: rack(standing),
    ball: IDLE_BALL,
    marks: NO_MARKS,
  });
  const roll = useRef<LaneRoll | undefined>(undefined);
  const activity = (): LaneActivity =>
    roll.current ? "rolling" : swipe.aiming() ? "aiming" : "idle";
  const frameTime = () => ({
    now: props.current.now(),
    endsAt: props.current.endsAt,
  });
  const rest = (standing: RollInputProps["standing"]) => {
    view.current = { ...view.current, pins: rack(standing), ball: IDLE_BALL };
  };

  useEffect(() => {
    if (activity() === "idle") rest(standing);
  }, [standing]);

  useEffect(() => {
    physics();
    let scene: LaneScene | undefined;
    let gone = false;
    scenery().then(({ createLaneScene }) => {
      if (gone || !canvas.current) return;
      scene = createLaneScene(canvas.current, props.current.ball);
    });
    let frame = 0;
    let last = performance.now();
    const expire = () => {
      const time = checkTime(activity(), frameTime());
      if (time === "running") return;
      setTimeUp(true);
      if (time === "over") return;
      roll.current = undefined;
      cancel();
      rest(props.current.standing);
      props.current.onMiss();
    };
    const tick = (now: number) => {
      expire();
      const current = roll.current;
      if (current) {
        current.step(now - last);
        view.current = {
          ...view.current,
          pins: current.pins(),
          ball: current.ball(),
        };
        if (current.settled) {
          const knocked = current.knocked();
          roll.current = undefined;
          rest(props.current.standing.filter((pin) => !knocked.includes(pin)));
          props.current.onRoll(knocked);
        }
      }
      last = now;
      view.current.marks = swipe.marks(now);
      scene?.draw(view.current, REST_CAMERA);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      gone = true;
      cancelAnimationFrame(frame);
      scene?.dispose();
      if (roll.current) props.current.onMiss();
    };
  }, []);

  const onPointerDown = (event: PointerEvent) => {
    const target = event.currentTarget as Element;
    const [start] = samplesOf(event);
    if (!start || !canStartSwipe(activity(), frameTime(), start)) return;
    target.setPointerCapture(event.pointerId);
    swipe.start(start);
    view.current = { ...view.current, ball: start };
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!swipe.aiming()) return;
    const ball = swipe.extend(samplesOf(event));
    view.current = { ...view.current, ball };
  };

  const cancel = () => {
    swipe.drop();
    view.current = { ...view.current, ball: IDLE_BALL };
  };

  const onPointerUp = async () => {
    if (!swipe.aiming()) return;
    const reading = swipe.release();
    view.current = { ...view.current, ball: IDLE_BALL };
    if (!reading) return;
    const { startRoll } = await physics();
    roll.current = startRoll(props.current.standing, reading);
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
      {timeUp && <p>Se acabó el tiempo.</p>}
    </div>
  );
};
