import type { Pin, RoomSnapshot } from "@bowling/domain";
import { Countdown } from "./countdown.js";
import { Lane } from "./lane.js";
import type { RollInput } from "./roll-input.js";
import { Scorecard } from "./scorecard.js";
import type { Seat } from "./session.js";

interface PlayProps {
  seat: Seat;
  frame: NonNullable<RoomSnapshot["frame"]>;
  onRoll: (knocked: Pin[]) => void;
  RollInput?: RollInput;
  now?: () => number;
}

export const Play = ({
  seat: { you, room, receivedAt },
  frame,
  onRoll,
  RollInput = Lane,
  now = Date.now,
}: PlayProps) => {
  const countdown = (
    <Countdown endsAt={receivedAt + frame.remainingMs} now={now} />
  );

  if (!frame.open) {
    return (
      <main class="play">
        <h1>Frame {frame.number}</h1>
        <Scorecard bowlers={room.bowlers} />
        <p>Siguiente frame en {countdown}</p>
      </main>
    );
  }

  const finished = room.bowlers.find((b) => b.id === you)?.finishedFrame;
  return (
    <main class="play">
      <h1>Frame {frame.number}</h1>
      <p>Quedan {countdown}</p>
      {finished ? (
        <p>Has terminado este frame. Esperando al resto…</p>
      ) : (
        <RollInput
          key={frame.number}
          standing={room.standing}
          onRoll={onRoll}
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
