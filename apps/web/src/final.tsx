import type { RoomSnapshot } from "@bowling/domain";
import { Scorecard } from "./scorecard.js";

const names = new Intl.ListFormat("es-ES", { type: "conjunction" });

export const Final = ({ room }: { room: RoomSnapshot }) => {
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
    </main>
  );
};
