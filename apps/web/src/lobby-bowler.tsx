import type { BowlerId, BowlerView } from "@bowling/domain";
import { Avatar, Chip, Icon } from "./ui.js";

const CROWN = "M3 7l4.5 5L12 5l4.5 7L21 7l-2 11H5z";

interface LobbyBowlerProps {
  bowler: BowlerView;
  isHost: boolean;
  isYou: boolean;
  onRemove?: (bowlerId: BowlerId) => void;
}

export const LobbyBowler = ({
  bowler: { id, nickname, colour, connected },
  isHost,
  isYou,
  onRemove,
}: LobbyBowlerProps) => (
  <li class={`lobby-bowler${isYou ? " you" : ""}${connected ? "" : " away"}`}>
    <Avatar nickname={nickname} colour={colour} away={!connected} />
    <span class="lobby-name">{nickname}</span>
    <span class="lobby-chips">
      {isHost && (
        <Chip tone="warning">
          <Icon d={CROWN} class="chip-icon" />
          anfitrión
        </Chip>
      )}
      {isYou && <Chip tone="accent">tú</Chip>}
      {!connected && <Chip tone="muted">desconectado</Chip>}
    </span>
    {onRemove && (
      <button
        type="button"
        class="lobby-remove"
        aria-label={`Quitar a ${nickname}`}
        onClick={() => onRemove(id)}
      >
        Quitar
      </button>
    )}
  </li>
);
