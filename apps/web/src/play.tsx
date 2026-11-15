import type { Pin, RoomSnapshot } from "@bowling/domain";
import { bowlerColour } from "./bowler-colour.js";
import type { Seat } from "./connection.js";
import { Lane } from "./lane.js";
import { PlayHeader } from "./play-header.js";
import { Reveal } from "./reveal.js";
import { RivalStrip } from "./rival-strip.js";
import type { RollInput } from "./roll-input.js";
import { RollOutcome } from "./roll-outcome.js";
import { Button, Chip, Dialog, Toast } from "./ui.js";
import "./styles/play.css";

interface PlayProps {
  seat: Seat;
  frame: NonNullable<RoomSnapshot["frame"]>;
  onRoll: (knocked: Pin[]) => void;
  missedAt?: number;
  onMiss: () => void;
  leaving: boolean;
  onAskLeave: () => void;
  onCancelLeave: () => void;
  onLeave: () => void;
  RollInput?: RollInput;
  webgl: boolean;
  // The Lane is still playing out this Frame's last Roll.
  playing: boolean;
  onPlayed: () => void;
  now?: () => number;
}

export const Play = ({
  seat: { you, room, receivedAt },
  frame,
  onRoll,
  missedAt,
  onMiss,
  leaving,
  onAskLeave,
  onCancelLeave,
  onLeave,
  RollInput = Lane,
  webgl,
  playing,
  onPlayed,
  now = Date.now,
}: PlayProps) => {
  const endsAt = receivedAt + frame.remainingMs;
  const notice = missedAt !== undefined && (
    <Toast tone="warning" since={missedAt} now={now}>
      Se acabó el tiempo: esa tirada no ha contado.
    </Toast>
  );

  const dialog = leaving && (
    <Dialog title="¿Salir de la sala?">
      <p>La partida seguirá sin ti y no podrás volver a entrar.</p>
      <Button variant="danger" onClick={onLeave}>
        Salir de la sala
      </Button>
      <Button variant="plain" onClick={onCancelLeave}>
        Seguir jugando
      </Button>
    </Dialog>
  );

  if (!frame.open) {
    return (
      <Reveal
        you={you}
        bowlers={room.bowlers}
        frame={frame.number}
        endsAt={endsAt}
        now={now}
        onAskLeave={onAskLeave}
      >
        {notice}
        {dialog}
      </Reveal>
    );
  }

  const own = room.bowlers.find((b) => b.id === you);
  const finished = own?.finishedFrame ?? false;
  const rolls = own?.frames[frame.number - 1]?.rolls ?? [];
  const onLane = !finished || playing;
  const bonus = !finished && frame.number === 10 && rolls.length === 2;
  return (
    <main class="play">
      <PlayHeader
        frame={frame.number}
        rolls={rolls}
        finished={finished}
        standing={room.standing}
        endsAt={endsAt}
        now={now}
        onAskLeave={onAskLeave}
      />
      {notice}
      {bonus && (
        <p class="play-bonus">
          <Chip tone="warning">Tirada de bonificación</Chip>
        </p>
      )}
      {!onLane ? (
        <section class="play-finished">
          <RollOutcome rolls={rolls} />
          <p class="play-finished-title">Has terminado este frame.</p>
          <p>Esperando al resto…</p>
          <p class="play-finished-note">
            Los resultados se revelan al cerrarse el frame.
          </p>
        </section>
      ) : !webgl ? (
        <p class="play-no-lane">Tu móvil no puede mostrar la pista</p>
      ) : (
        <RollInput
          key={frame.number}
          standing={room.standing}
          ball={bowlerColour(own?.colour ?? 0)}
          onRoll={onRoll}
          endsAt={endsAt}
          now={now}
          onMiss={onMiss}
          finished={finished}
          onPlayed={onPlayed}
        />
      )}
      {onLane && <RollOutcome rolls={rolls} />}
      <RivalStrip rivals={room.bowlers.filter((b) => b.id !== you)} />
      {dialog}
    </main>
  );
};
