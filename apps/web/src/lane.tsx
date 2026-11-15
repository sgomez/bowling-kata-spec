import { useEffect, useRef, useState } from "preact/hooks";
import { rack } from "./knock.js";
import { canStartSwipe, checkTime, type LaneActivity } from "./lane-gate.js";
import { FOUL_LINE } from "./lane-geometry.js";
import type { LaneRoll } from "./lane-physics.js";
import { drawLane, type LaneScene } from "./lane-render.js";
import type { RollInputProps } from "./roll-input.js";
import { readSwipe, type SwipeSample, toLane } from "./swipe.js";

const RESULT_PAUSE_MS = 800;
const IDLE_BALL = { x: 0, y: FOUL_LINE / 2 };

const physics = () => import("./lane-physics.js");

export const Lane = (input: RollInputProps) => {
  const { standing } = input;
  const canvas = useRef<HTMLCanvasElement>(null);
  const props = useRef(input);
  props.current = input;
  const [timeUp, setTimeUp] = useState(false);
  const scene = useRef<LaneScene>({
    pins: rack(standing),
    ball: IDLE_BALL,
    trail: [],
  });
  const roll = useRef<LaneRoll | undefined>(undefined);
  const aiming = useRef(false);
  const activity = (): LaneActivity =>
    roll.current ? "rolling" : aiming.current ? "aiming" : "idle";
  const frameTime = () => ({
    now: props.current.now(),
    endsAt: props.current.endsAt,
  });

  useEffect(() => {
    if (activity() !== "idle") return;
    scene.current = { pins: rack(standing), ball: IDLE_BALL, trail: [] };
  }, [standing]);

  useEffect(() => {
    physics();
    let frame = 0;
    let last = performance.now();
    let settledAt: number | undefined;
    const expire = () => {
      const time = checkTime(activity(), frameTime());
      if (time === "running") return;
      setTimeUp(true);
      if (time === "over") return;
      roll.current = undefined;
      aiming.current = false;
      settledAt = undefined;
      scene.current = {
        pins: rack(props.current.standing),
        ball: IDLE_BALL,
        trail: [],
      };
      props.current.onMiss();
    };
    const tick = (now: number) => {
      expire();
      const current = roll.current;
      if (current) {
        current.step(now - last);
        scene.current = {
          pins: current.pins(),
          ball: current.ball(),
          trail: [],
        };
        if (current.settled) {
          settledAt ??= now;
          if (now - settledAt > RESULT_PAUSE_MS) {
            const knocked = current.knocked();
            const left = props.current.standing.filter(
              (pin) => !knocked.includes(pin),
            );
            roll.current = undefined;
            settledAt = undefined;
            scene.current = { pins: rack(left), ball: IDLE_BALL, trail: [] };
            props.current.onRoll(knocked);
          }
        }
      }
      last = now;
      if (canvas.current) drawLane(canvas.current, scene.current);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      if (roll.current) props.current.onMiss();
    };
  }, []);

  const onPointerDown = (event: PointerEvent) => {
    const target = event.currentTarget as Element;
    const start = toLane(event, target.getBoundingClientRect());
    if (!canStartSwipe(activity(), frameTime(), start.y)) return;
    target.setPointerCapture(event.pointerId);
    aiming.current = true;
    scene.current = { ...scene.current, ball: start, trail: [start] };
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!aiming.current) return;
    const samples = event.getCoalescedEvents?.() ?? [];
    const rect = (event.currentTarget as Element).getBoundingClientRect();
    const moves = (samples.length > 0 ? samples : [event]).map((e) =>
      toLane(e, rect),
    );
    const trail = [...scene.current.trail, ...moves];
    const ball = trail.at(-1) as SwipeSample;
    scene.current = { ...scene.current, ball, trail };
  };

  const cancel = () => {
    aiming.current = false;
    scene.current = { ...scene.current, ball: IDLE_BALL, trail: [] };
  };

  const onPointerUp = async () => {
    if (!aiming.current) return;
    const swipe = readSwipe(scene.current.trail);
    cancel();
    if (!swipe) return;
    const { startRoll } = await physics();
    roll.current = startRoll(props.current.standing, swipe);
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
