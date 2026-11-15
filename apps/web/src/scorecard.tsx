import {
  type BowlerId,
  type BowlerView,
  type FrameView,
  standings,
} from "@bowling/domain";
import { Avatar, Chip } from "./ui.js";
import "./styles/scorecard.css";

const FRAME_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const EMPTY: FrameView = { rolls: [], score: null };

const markClass = (roll: string) =>
  roll === "X" ? "strike" : roll === "/" ? "spare" : undefined;

// A Strike sits in the second box of Frames 1 to 9, as on a paper scorecard.
const boxes = (rolls: string[], tenth: boolean) =>
  !tenth && rolls[0] === "X" ? ["", "X"] : rolls;

const Frame = ({ frame, n }: { frame: FrameView; n: number }) => {
  const played = frame.rolls.length > 0;
  const pending = played && frame.score === null;
  return (
    <div
      class={`scorecard-frame${pending ? " pending" : played ? "" : " empty"}`}
    >
      <span class="scorecard-rolls">
        {boxes(frame.rolls, n === 10).map((roll, i) => (
          <span key={i} class={markClass(roll)}>
            {roll}
          </span>
        ))}
      </span>
      <span class="scorecard-score">{pending ? "···" : frame.score}</span>
    </div>
  );
};

interface ScorecardProps {
  you: BowlerId;
  bowlers: readonly BowlerView[];
}

export const Scorecard = ({ you, bowlers }: ScorecardProps) => (
  <ol class="scorecard">
    {standings(bowlers).map(({ position, bowler }) => (
      <li
        key={bowler.id}
        class="scorecard-row"
        aria-current={bowler.id === you ? "true" : undefined}
      >
        <div class="scorecard-head">
          <span class="scorecard-position">{position}</span>
          <Avatar
            nickname={bowler.nickname}
            colour={bowler.colour}
            away={!bowler.connected}
          />
          <span class="scorecard-name">{bowler.nickname}</span>
          {bowler.id === you && <Chip tone="accent">tú</Chip>}
          <span class="scorecard-total">{bowler.total}</span>
        </div>
        <div class="scorecard-numbers" aria-hidden="true">
          {FRAME_NUMBERS.map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
        <div class="scorecard-frames">
          {FRAME_NUMBERS.map((n) => (
            <Frame key={n} n={n} frame={bowler.frames[n - 1] ?? EMPTY} />
          ))}
        </div>
      </li>
    ))}
  </ol>
);

export const ScorecardLegend = () => (
  <p class="scorecard-legend">
    <span>
      <strong class="strike">X</strong> pleno
    </span>
    <span>
      <strong class="spare">/</strong> semipleno
    </span>
    <span>
      <strong>-</strong> cero
    </span>
    <span>
      <strong>1–9</strong> bolos derribados
    </span>
    <span>
      <strong class="pending">···</strong> pendiente de bonificación
    </span>
  </p>
);
