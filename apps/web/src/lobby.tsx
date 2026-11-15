import { MAX_BOWLERS } from "@bowling/domain";
import type { Seat } from "./session.js";

interface LobbyProps {
  seat: Seat;
  link: string;
  shareNotice?: string;
  onShare: () => void;
  onStart: () => void;
}

export const Lobby = ({
  seat: { you, room },
  link,
  shareNotice,
  onShare,
  onStart,
}: LobbyProps) => {
  const isHost = room.hostId === you;

  return (
    <main>
      <h1>Sala {room.code}</h1>
      <p class="invite">{link}</p>
      <button type="button" onClick={onShare}>
        Compartir invitación
      </button>
      {shareNotice && <p role="status">{shareNotice}</p>}
      <h2>
        Jugadores ({room.bowlers.length}/{MAX_BOWLERS})
      </h2>
      <ul>
        {room.bowlers.map((bowler) => (
          <li key={bowler.id}>
            {bowler.nickname}
            {bowler.id === room.hostId && " (anfitrión)"}
            {bowler.id === you && " (tú)"}
          </li>
        ))}
      </ul>
      {room.phase === "playing" ? (
        <p>¡La partida ha empezado!</p>
      ) : isHost ? (
        <button type="button" onClick={onStart}>
          Empezar partida
        </button>
      ) : (
        <p>Esperando a que el anfitrión empiece…</p>
      )}
    </main>
  );
};
