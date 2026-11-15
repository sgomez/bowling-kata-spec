import {
  type BowlerId,
  type BowlerView,
  type FrameNumber,
  leaders,
  standings,
} from "@bowling/domain";
import type { ComponentChildren } from "preact";
import { NextFrame } from "./next-frame.js";
import { ScorecardButton } from "./scorecard-sheet.js";
import { Avatar, Chip, Icon } from "./ui.js";
import "./styles/reveal.css";
import { CROWN } from "./icons.js";

const FLIP_FROM_MS = 300;
const FLIP_MS = 320;
const BOWLER_GAP_MS = 140;
const ROLL_GAP_MS = 90;
const REORDER_MS = 400;

const names = new Intl.ListFormat("es-ES", { type: "conjunction" });

const totalBefore = (bowler: BowlerView, frame: FrameNumber) =>
  Math.max(0, ...bowler.frames.slice(0, frame - 1).map((f) => f.score ?? 0));

const bonusPending = (bowler: BowlerView) =>
  bowler.frames.some((f) => f.rolls.length > 0 && f.score === null);

const rollClass = (roll: string) =>
  roll === "X" ? "roll strike" : roll === "/" ? "roll spare" : "roll";

interface RevealProps {
  you: BowlerId;
  bowlers: readonly BowlerView[];
  frame: FrameNumber;
  endsAt: number;
  now: () => number;
  children?: ComponentChildren;
}

export const Reveal = ({
  you,
  bowlers,
  frame,
  endsAt,
  now,
  children,
}: RevealProps) => {
  const ranked = standings(bowlers);
  const before = standings(
    bowlers.map((bowler) => ({ bowler, total: totalBefore(bowler, frame) })),
  ).map((r) => r.bowler.bowler);
  const flipAt = (bowler: BowlerView, roll: number) =>
    FLIP_FROM_MS + before.indexOf(bowler) * BOWLER_GAP_MS + roll * ROLL_GAP_MS;
  const flipped = Math.max(
    ...bowlers.map(
      (b) =>
        flipAt(b, Math.max(0, b.frames[frame - 1].rolls.length - 1)) + FLIP_MS,
    ),
  );
  const leading = leaders(ranked);

  return (
    <main
      class="reveal"
      style={{
        "--reorder-at": `${flipped}ms`,
        "--lead-at": `${flipped + REORDER_MS}ms`,
      }}
    >
      <header class="reveal-title">
        <span class="reveal-label">Resultados</span>
        <h1>Frame {frame}</h1>
      </header>
      {children}
      <p class="reveal-lead">
        <Icon d={CROWN} class="reveal-crown" />
        <span>
          {names.format(leading.map((b) => b.nickname))}{" "}
          {leading.length === 1 ? "va" : "van"} en cabeza
        </span>
        {leading.map((b) => (
          <Avatar key={b.id} nickname={b.nickname} colour={b.colour} />
        ))}
      </p>
      <ol class="reveal-list">
        {ranked.map(({ position, bowler }, index) => (
          <li
            key={bowler.id}
            class={position === 1 ? "reveal-row leader" : "reveal-row"}
            style={{ "--from": before.indexOf(bowler) - index }}
          >
            <span class="reveal-position">{position}</span>
            <Avatar
              nickname={bowler.nickname}
              colour={bowler.colour}
              away={!bowler.connected}
            />
            <span class="reveal-who">
              <span class="reveal-name">
                {bowler.nickname}
                {bowler.id === you && <Chip tone="accent">tú</Chip>}
              </span>
              {bonusPending(bowler) && (
                <span class="reveal-bonus">+ bonificación pendiente</span>
              )}
            </span>
            <span class="reveal-rolls">
              {bowler.frames[frame - 1].rolls.map((roll, i) => (
                <span
                  key={i}
                  class={rollClass(roll)}
                  style={{ animationDelay: `${flipAt(bowler, i)}ms` }}
                >
                  {roll}
                </span>
              ))}
            </span>
            <span class="reveal-total">{bowler.total}</span>
          </li>
        ))}
      </ol>
      <footer class="reveal-actions">
        <ScorecardButton you={you} bowlers={bowlers} />
        <NextFrame endsAt={endsAt} now={now} />
      </footer>
    </main>
  );
};
