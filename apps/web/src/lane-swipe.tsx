import { useRef, useState } from "preact/hooks";
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

export const useSwipe = () => {
  const [hint, setHint] = useState(() => !hintSeen());
  const [reading, setReading] = useState<Swipe | undefined>(undefined);
  const [swiping, setSwiping] = useState(false);
  const aiming = useRef(false);
  const samples = useRef<SwipeSample[]>([]);
  const live = useRef(NO_MARKS);
  const released = useRef({ marks: NO_MARKS, at: 0 });

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
      follow([sample]);
      setSwiping(true);
    },
    extend(more: SwipeSample[]) {
      follow([...samples.current, ...more]);
      return samples.current.at(-1) as SwipeSample;
    },
    drop,
    release() {
      const swipe = readSwipe(samples.current);
      drop();
      if (swipe) {
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
    overlay: (timeUp: boolean) => (
      <>
        {hint && !swiping && !timeUp && <SwipeHint />}
        {reading && <SwipeGauge swipe={reading} />}
      </>
    ),
  };
};
