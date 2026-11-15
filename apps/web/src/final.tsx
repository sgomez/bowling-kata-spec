import {
  type BowlerView,
  leaders,
  type Standing,
  standings,
} from "@bowling/domain";
import type { Seat } from "./connection.js";
import { Scorecard, ScorecardLegend } from "./scorecard.js";
import { Avatar, Button, Icon } from "./ui.js";
import "./styles/final.css";
import { CROWN, RETRY } from "./icons.js";

const names = new Intl.ListFormat("es-ES", { type: "conjunction" });

// A single winner stands in the middle; tied winners stand side by side.
const podiumOrder = <T,>(ranked: Standing<T>[]) => {
  const [first, second, ...rest] = ranked.filter((s) => s.position <= 3);
  return (
    second?.position === 1 ? [first, second, ...rest] : [second, first, ...rest]
  ).filter(Boolean);
};

const Step = ({ position, bowler }: Standing<BowlerView>) => (
  <li class={`podium-step podium-${position}`}>
    {position === 1 ? (
      <Icon d={CROWN} class="podium-crown" />
    ) : (
      <span class="podium-crown" />
    )}
    <Avatar
      nickname={bowler.nickname}
      colour={bowler.colour}
      away={!bowler.connected}
    />
    <span class="podium-name">{bowler.nickname}</span>
    <span class="podium-total">{bowler.total}</span>
    <span class="podium-block">{position}</span>
  </li>
);

interface FinalProps {
  seat: Seat;
  onRematch: () => void;
  onLeave: () => void;
}

export const Final = ({
  seat: { you, room },
  onRematch,
  onLeave,
}: FinalProps) => {
  const ranked = standings(room.bowlers);
  const winners = leaders(ranked).map((b) => b.nickname);

  return (
    <main class="final">
      <header class="final-title">
        <span class="final-label">Partida terminada</span>
        <h1>
          {winners.length === 1
            ? `¡Gana ${winners[0]}!`
            : `Empate entre ${names.format(winners)}`}
        </h1>
      </header>
      <ol aria-label="Podio" class="podium">
        {podiumOrder(ranked).map((standing) => (
          <Step key={standing.bowler.id} {...standing} />
        ))}
      </ol>
      <section class="final-scorecard">
        <h2>Marcador completo</h2>
        <ScorecardLegend />
        <Scorecard you={you} bowlers={room.bowlers} />
      </section>
      <footer class="final-actions">
        {room.hostId === you ? (
          <Button variant="primary" onClick={onRematch}>
            <Icon d={RETRY} />
            Revancha
          </Button>
        ) : (
          <p class="final-waiting">
            Esperando a que el anfitrión pida la revancha…
          </p>
        )}
        <Button variant="plain" onClick={onLeave}>
          Salir de la sala
        </Button>
      </footer>
    </main>
  );
};
