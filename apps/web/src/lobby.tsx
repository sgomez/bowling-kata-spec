import { type BowlerId, MAX_BOWLERS } from "@bowling/domain";
import type { Seat } from "./connection.js";
import type { ShareOutcome } from "./invite.js";
import { LobbyBowler } from "./lobby-bowler.js";
import { Button, Chip, Dialog, Icon, Notice, Toast } from "./ui.js";
import "./styles/lobby.css";

const LEAVE = "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9";
const LINK =
  "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71";
const SHARE =
  "M21 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM9 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 19a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98";

const SHARE_TOASTS: Partial<
  Record<ShareOutcome, { tone: "success" | "error"; text: string }>
> = {
  copied: { tone: "success", text: "Enlace copiado." },
  failed: {
    tone: "error",
    text: "No se ha podido compartir; copia el enlace a mano.",
  },
};

interface LobbyProps {
  seat: Seat;
  link: string;
  shared?: ShareOutcome;
  error?: string;
  removing?: BowlerId;
  onShare: () => void;
  onStart: () => void;
  onLeave: () => void;
  onAskRemove: (bowlerId: BowlerId) => void;
  onCancelRemove: () => void;
  onRemove: (bowlerId: BowlerId) => void;
}

export const Lobby = ({
  seat: { you, room },
  link,
  shared,
  error,
  removing,
  onShare,
  onStart,
  onLeave,
  onAskRemove,
  onCancelRemove,
  onRemove,
}: LobbyProps) => {
  const isHost = room.hostId === you;
  const full = room.bowlers.length >= MAX_BOWLERS;
  const freeSeats = MAX_BOWLERS - room.bowlers.length;
  const toast = shared && SHARE_TOASTS[shared];
  const confirming = room.bowlers.find((b) => b.id === removing);

  return (
    <main class="lobby">
      <button type="button" class="lobby-leave" onClick={onLeave}>
        <Icon d={LEAVE} />
        Salir de la sala
      </button>
      <header class="lobby-room">
        <span class="lobby-label">Sala</span>
        <h1 class="lobby-code">{room.code}</h1>
        <span class="lobby-link">
          <Icon d={LINK} />
          {link}
        </span>
      </header>
      <Button variant="secondary" onClick={onShare}>
        <Icon d={SHARE} />
        Compartir invitación
      </Button>
      <section class="lobby-bowlers">
        <div class="lobby-heading">
          <h2>
            Jugadores ({room.bowlers.length}/{MAX_BOWLERS})
          </h2>
          {full && <Chip tone="warning">sala completa</Chip>}
        </div>
        <ul>
          {room.bowlers.map((bowler) => (
            <LobbyBowler
              key={bowler.id}
              bowler={bowler}
              isHost={bowler.id === room.hostId}
              isYou={bowler.id === you}
              onRemove={isHost && bowler.id !== you ? onAskRemove : undefined}
            />
          ))}
          {Array.from({ length: freeSeats }, (_, seat) => (
            <li key={`free-${seat}`} class="lobby-free">
              <span aria-hidden="true" class="lobby-free-avatar" />
              Hueco libre
            </li>
          ))}
        </ul>
      </section>
      <footer class="lobby-footer">
        {error && <Notice tone="error">{error}</Notice>}
        {toast && <Toast tone={toast.tone}>{toast.text}</Toast>}
        {isHost ? (
          <Button variant="primary" onClick={onStart}>
            Empezar partida
          </Button>
        ) : (
          <p class="lobby-waiting">
            <span aria-hidden="true" class="lobby-dots">
              <span />
              <span />
              <span />
            </span>
            Esperando a que el anfitrión empiece…
          </p>
        )}
      </footer>
      {confirming && (
        <Dialog title={`¿Quitar a ${confirming.nickname} de la sala?`}>
          <p>{confirming.nickname} saldrá de la sala ahora mismo.</p>
          <Button variant="danger" onClick={() => onRemove(confirming.id)}>
            Quitar
          </Button>
          <Button variant="plain" onClick={onCancelRemove}>
            Cancelar
          </Button>
        </Dialog>
      )}
    </main>
  );
};
