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

const CROWN = "M3 7l4.5 5L12 5l4.5 7L21 7l-2 11H5z";
const REMATCH =
  "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15";

const names = new Intl.ListFormat("es-ES", { type: "conjunction" });

// A single winner stands in the middle; tied winners stand side by side.
const podiumOrder = <T,>([first, second, third]: Standing<T>[]) =>
  (second?.position === 1
    ? [first, second, third]
    : [second, first, third]
  ).filter(Boolean);

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
            <Icon d={REMATCH} />
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
