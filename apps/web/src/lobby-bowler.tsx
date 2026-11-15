import type { BowlerId, BowlerView } from "@bowling/domain";
import { CROWN } from "./icons.js";
import { Avatar, Chip, Icon } from "./ui.js";

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
