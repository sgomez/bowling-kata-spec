import { useEffect, useRef, useState } from "preact/hooks";
import { pastSwipeLimit } from "./lane-gate.js";
import { NO_MARKS, type SwipeMarks } from "./lane-swipe-marks.js";
import { readSwipe, type Swipe, type SwipeSample } from "./swipe.js";
import { aimOf } from "./swipe-aim.js";
import { hintSeen, rememberHint } from "./swipe-hint.js";
import { SwipeGauge, SwipeHint } from "./swipe-overlay.js";
import { trailOpacity, trailWidth } from "./swipe-trail.js";
import "./styles/swipe.css";

const marksOf = (
  samples: readonly SwipeSample[],
  swipe: Swipe | undefined,
): SwipeMarks => ({
  trail: samples,
  width: trailWidth(swipe),
  opacity: 1,
  aim: swipe ? aimOf(swipe) : [],
});

// Long enough to read the Foul before the Lane moves on.
export const FOUL_PAUSE_MS = 3_000;

export const useSwipe = (onPlayed: () => void) => {
  const [hint, setHint] = useState(() => !hintSeen());
  const [reading, setReading] = useState<Swipe | undefined>(undefined);
  const [swiping, setSwiping] = useState(false);
  const [thrown, setThrown] = useState(false);
  const aiming = useRef(false);
  const samples = useRef<SwipeSample[]>([]);
  const live = useRef(NO_MARKS);
  const released = useRef({ marks: NO_MARKS, at: 0 });
  const pause = useRef<ReturnType<typeof setTimeout>>(undefined);

  const played = () => {
    setThrown(false);
    onPlayed();
  };

  const settle = () => {
    if (!pause.current) return;
    clearTimeout(pause.current);
    pause.current = undefined;
    played();
  };
  useEffect(() => settle, []);

  const follow = (trail: SwipeSample[]) => {
    const swipe = readSwipe(trail);
    samples.current = trail;
    live.current = marksOf(trail, swipe);
    setReading(swipe);
  };

  const drop = () => {
    aiming.current = false;
    released.current = { marks: live.current, at: performance.now() };
    setSwiping(false);
  };

  return {
    aiming: () => aiming.current,
    start(sample: SwipeSample) {
      aiming.current = true;
      settle();
      follow([sample]);
      setSwiping(true);
    },
    extend(more: SwipeSample[]) {
      follow([...samples.current, ...more]);
      return samples.current.at(-1) as SwipeSample;
    },
    drop,
    overstepped(event: { clientY: number; currentTarget: EventTarget | null }) {
      const rect = (event.currentTarget as Element).getBoundingClientRect();
      if (!pastSwipeLimit(event.clientY, rect)) return false;
      drop();
      setThrown(true);
      pause.current = setTimeout(settle, FOUL_PAUSE_MS);
      return true;
    },
    played,
    release() {
      const swipe = readSwipe(samples.current);
      drop();
      if (swipe) {
        setThrown(true);
        rememberHint();
        setHint(false);
      }
      return swipe;
    },
    marks(now: number): SwipeMarks {
      if (aiming.current) return live.current;
      const { marks, at } = released.current;
      return { ...marks, opacity: trailOpacity(now - at) };
    },
    overlay: (timeUp: boolean, finished: boolean) => (
      <>
        {!finished && !thrown && (
          <div class="swipe-limit">
            <span>Línea de falta</span>
          </div>
        )}
        {hint && !swiping && !timeUp && <SwipeHint />}
        {reading && <SwipeGauge swipe={reading} />}
      </>
    ),
  };
};
