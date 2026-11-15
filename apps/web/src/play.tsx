import type { Pin, RoomSnapshot } from "@bowling/domain";
import type { Seat } from "./connection.js";
import { Countdown } from "./countdown.js";
import { Lane } from "./lane.js";
import { Reveal } from "./reveal.js";
import type { RollInput } from "./roll-input.js";

interface PlayProps {
  seat: Seat;
  frame: NonNullable<RoomSnapshot["frame"]>;
  onRoll: (knocked: Pin[]) => void;
  missed: boolean;
  onMiss: () => void;
  RollInput?: RollInput;
  now?: () => number;
}

export const Play = ({
  seat: { you, room, receivedAt },
  frame,
  onRoll,
  missed,
  onMiss,
  RollInput = Lane,
  now = Date.now,
}: PlayProps) => {
  const endsAt = receivedAt + frame.remainingMs;
  const countdown = <Countdown endsAt={endsAt} now={now} />;
  const notice = missed && (
    <p role="status">Se acabó el tiempo: esa tirada no ha contado.</p>
  );

  if (!frame.open) {
    return (
      <Reveal
        you={you}
        bowlers={room.bowlers}
        frame={frame.number}
        endsAt={endsAt}
        now={now}
      >
        {notice}
      </Reveal>
    );
  }

  const finished = room.bowlers.find((b) => b.id === you)?.finishedFrame;
  return (
    <main class="play">
      <h1>Frame {frame.number}</h1>
      <p>Quedan {countdown}</p>
      {notice}
      {finished ? (
        <p>Has terminado este frame. Esperando al resto…</p>
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
      <ul class="progress">
        {room.bowlers.map((bowler) => (
          <li key={bowler.id}>
            {bowler.nickname}:{" "}
            {bowler.finishedFrame ? "ha terminado" : "jugando…"}
            {!bowler.connected && " (desconectado)"}
          </li>
        ))}
      </ul>
    </main>
  );
};
