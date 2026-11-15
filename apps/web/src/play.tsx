import type { Pin, RoomSnapshot } from "@bowling/domain";
import type { Seat } from "./connection.js";
import { Countdown } from "./countdown.js";
import { Lane } from "./lane.js";
import { PlayHeader } from "./play-header.js";
import { RivalStrip } from "./rival-strip.js";
import type { RollInput } from "./roll-input.js";
import { RollOutcome } from "./roll-outcome.js";
import { Scorecard } from "./scorecard.js";
import { Button, Chip, Dialog, Toast } from "./ui.js";
import "./styles/play.css";

interface PlayProps {
  seat: Seat;
  frame: NonNullable<RoomSnapshot["frame"]>;
  onRoll: (knocked: Pin[]) => void;
  missed: boolean;
  onMiss: () => void;
  leaving: boolean;
  onAskLeave: () => void;
  onCancelLeave: () => void;
  onLeave: () => void;
  RollInput?: RollInput;
  now?: () => number;
}

export const Play = ({
  seat: { you, room, receivedAt },
  frame,
  onRoll,
  missed,
  onMiss,
  leaving,
  onAskLeave,
  onCancelLeave,
  onLeave,
  RollInput = Lane,
  now = Date.now,
}: PlayProps) => {
  const endsAt = receivedAt + frame.remainingMs;
  const countdown = <Countdown endsAt={endsAt} now={now} />;
  const notice = missed && (
    <Toast tone="warning">Se acabó el tiempo: esa tirada no ha contado.</Toast>
  );

  if (!frame.open) {
    return (
      <main class="play">
        <h1>Frame {frame.number}</h1>
        {notice}
        <Scorecard bowlers={room.bowlers} />
        <p>Siguiente frame en {countdown}</p>
      </main>
    );
  }

  const own = room.bowlers.find((b) => b.id === you);
  const finished = own?.finishedFrame ?? false;
  const rolls = own?.frames[frame.number - 1]?.rolls ?? [];
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
      {finished ? (
        <section class="play-finished">
          <RollOutcome rolls={rolls} />
          <p class="play-finished-title">Has terminado este frame.</p>
          <p>Esperando al resto…</p>
          <p class="play-finished-note">
            Los resultados se revelan al cerrarse el frame.
          </p>
        </section>
      ) : (
        <RollInput
          key={frame.number}
          standing={room.standing}
          onRoll={onRoll}
          endsAt={endsAt}
          now={now}
          onMiss={onMiss}
        />
      )}
      {!finished && <RollOutcome rolls={rolls} />}
      <RivalStrip rivals={room.bowlers.filter((b) => b.id !== you)} />
      {leaving && (
        <Dialog title="¿Salir de la sala?">
          <p>La partida seguirá sin ti y no podrás volver a entrar.</p>
          <Button variant="danger" onClick={onLeave}>
            Salir de la sala
          </Button>
          <Button variant="plain" onClick={onCancelLeave}>
            Seguir jugando
          </Button>
        </Dialog>
      )}
    </main>
  );
};
