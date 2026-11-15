import { Scorecard } from "./scorecard.js";
import type { Seat } from "./session.js";

const names = new Intl.ListFormat("es-ES", { type: "conjunction" });

interface FinalProps {
  seat: Seat;
  onRematch: () => void;
}

export const Final = ({ seat: { you, room }, onRematch }: FinalProps) => {
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
      <Scorecard bowlers={room.bowlers} />
      {room.hostId === you ? (
        <button type="button" onClick={onRematch}>
          Revancha
        </button>
      ) : (
        <p>Esperando a que el anfitrión pida la revancha…</p>
      )}
    </main>
  );
};
