import type { BowlerView } from "@bowling/domain";
import { Avatar } from "./ui.js";

const stateOf = ({ connected, finishedFrame }: BowlerView) =>
  !connected ? "away" : finishedFrame ? "finished" : "playing";

const LABELS = {
  away: "desconectado",
  finished: "ha terminado",
  playing: "jugando…",
};

export const RivalStrip = ({ rivals }: { rivals: readonly BowlerView[] }) => (
  <ul aria-label="Progreso de los rivales" class="rivals">
    {rivals.map((rival) => {
      const state = stateOf(rival);
      return (
        <li key={rival.id} class={`rival ${state}`}>
          <span class="rival-avatar">
            <Avatar
              nickname={rival.nickname}
              colour={rival.colour}
              away={state === "away"}
            />
            <span aria-hidden="true" class="rival-dot" />
          </span>
          <span class="rival-name">{rival.nickname}</span>
          <span class="rival-state">{LABELS[state]}</span>
        </li>
      );
    })}
  </ul>
);
