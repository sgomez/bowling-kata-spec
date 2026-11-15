import { useEffect, useRef, useState } from "preact/hooks";
import { atRest } from "./lane-choreography.js";
import { canStartSwipe, checkTime, type LaneActivity } from "./lane-gate.js";
import { FOUL_LINE } from "./lane-geometry.js";
import type { LaneRoll } from "./lane-physics.js";
import { advance, type LanePlay, playRoll } from "./lane-play.js";
import { REST_CAMERA } from "./lane-projection.js";
import type { LaneScene, LaneView } from "./lane-scene.js";
import type { RollInputProps } from "./roll-input.js";
import { readSwipe, toLane } from "./swipe.js";

const IDLE_BALL = { x: 0, y: FOUL_LINE / 2 };
const manner = () => ({
  reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
});

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
  const view = useRef<LaneView>({ ...atRest(standing, IDLE_BALL), trail: [] });
  const roll = useRef<LaneRoll | undefined>(undefined);
  const play = useRef<LanePlay | undefined>(undefined);
  const resting = useRef(standing);
  const aiming = useRef(false);
  const activity = (): LaneActivity =>
    roll.current ? "rolling" : aiming.current ? "aiming" : "idle";
  const frameTime = () => ({
    now: props.current.now(),
    endsAt: props.current.endsAt,
  });
  const rest = () => {
    play.current = undefined;
    view.current = { ...atRest(resting.current, IDLE_BALL), trail: [] };
  };

  useEffect(() => {
    resting.current = standing;
    if (activity() === "idle" && !play.current) rest();
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
      aiming.current = false;
      rest();
      props.current.onMiss();
    };
    const tick = (now: number) => {
      expire();
      if (play.current) {
        const { staging, knocked } = advance(
          play.current,
          now - last,
          roll.current,
          manner(),
        );
        view.current = { ...staging, trail: [] };
        if (knocked) {
          roll.current = undefined;
          resting.current = resting.current.filter((p) => !knocked.includes(p));
          props.current.onRoll(knocked);
        }
        if (staging.done) rest();
      }
      last = now;
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
    aiming.current = true;
    rest();
    const ball = { ...view.current.ball, ...start };
    view.current = { ...view.current, ball, trail: [start] };
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!aiming.current) return;
    const trail = [...view.current.trail, ...samplesOf(event)];
    const ball = { ...view.current.ball, ...trail.at(-1) };
    view.current = { ...view.current, ball, trail };
  };

  const cancel = () => {
    aiming.current = false;
    rest();
  };

  const onPointerUp = async () => {
    if (!aiming.current) return;
    const swipe = readSwipe(view.current.trail);
    cancel();
    if (!swipe) return;
    const { startRoll } = await physics();
    roll.current = startRoll(props.current.standing, swipe);
    play.current = playRoll(props.current.standing, swipe);
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
      <p>
        {timeUp
          ? "Se acabó el tiempo."
          : "Desliza el dedo hacia los bolos. Curva el gesto para darle efecto."}
      </p>
    </div>
  );
};
