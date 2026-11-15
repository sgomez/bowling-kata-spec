import type { Seat } from "./connection.js";
import { Scorecard } from "./scorecard.js";

const names = new Intl.ListFormat("es-ES", { type: "conjunction" });

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
  const winners = room.bowlers
    .filter((b) => room.winners.includes(b.id))
    .map((b) => b.nickname);

  return (
    <main>
      <h1>Partida terminada</h1>
      <p class="winner">
        {winners.length === 1
          ? `¡Gana ${winners[0]}!`
          : `Empate entre ${names.format(winners)}`}
      </p>
      <Scorecard you={you} bowlers={room.bowlers} />
      {room.hostId === you ? (
        <button type="button" onClick={onRematch}>
          Revancha
        </button>
      ) : (
        <p>Esperando a que el anfitrión pida la revancha…</p>
      )}
      <button type="button" onClick={onLeave}>
        Salir de la sala
      </button>
    </main>
  );
};
