import type { BowlerId } from "@bowling/domain";
import { useSignal } from "@preact/signals";
import type { Connection } from "./connection.js";
import { Final } from "./final.js";
import { Home } from "./home.js";
import { inviteLink, type ShareOutcome, shareInvite } from "./invite.js";
import { Lobby } from "./lobby.js";
import { closedMessage, errorMessage } from "./messages.js";
import { Reconnecting, ServerRestart } from "./notices.js";
import { Play } from "./play.js";
import { Notice } from "./ui.js";

interface AppProps {
  connection: Connection;
  initialCode: string;
  origin: string;
  webgl: boolean;
}

export const App = (props: AppProps) => {
  const reconnecting = props.connection.reconnecting.value;
  return (
    <>
      <Screen {...props} />
      {reconnecting && <Reconnecting {...reconnecting} now={Date.now} />}
    </>
  );
};

const Screen = ({ connection, initialCode, origin, webgl }: AppProps) => {
  const shared = useSignal<ShareOutcome | undefined>(undefined);
  const removing = useSignal<BowlerId | undefined>(undefined);
  const leaving = useSignal(false);
  const playing = useSignal<number | undefined>(undefined);
  const seat = connection.seat.value;
  const error = connection.error.value;
  const closed = connection.closed.value;

  if (closed === "SERVER_SHUTDOWN") {
    return <ServerRestart />;
  }
  if (!seat) {
    return (
      <Home
        initialCode={closed ? "" : initialCode}
        error={
          closed
            ? closedMessage(closed)
            : connection.removed.value
              ? "El anfitrión te ha sacado de la sala."
              : error && errorMessage(error)
        }
        entering={connection.entering.value}
        onCreate={connection.create}
        onJoin={connection.join}
      />
    );
  }

  const notice = error && errorMessage(error);
  if (seat.room.phase === "finished") {
    return (
      <Final
        seat={seat}
        onRematch={connection.rematch}
        onLeave={connection.leave}
      />
    );
  }
  if (seat.room.frame) {
    const { number } = seat.room.frame;
    return (
      <>
        <Play
          seat={seat}
          frame={seat.room.frame}
          onRoll={(knocked) => {
            playing.value = number;
            connection.roll(knocked);
          }}
          playing={playing.value === number}
          onPlayed={() => {
            playing.value = undefined;
          }}
          webgl={webgl}
          missed={connection.missed.value === number}
          onMiss={connection.miss}
          leaving={leaving.value}
          onAskLeave={() => {
            leaving.value = true;
          }}
          onCancelLeave={() => {
            leaving.value = false;
          }}
          onLeave={() => {
            leaving.value = false;
            connection.leave();
          }}
        />
        {notice && <Notice tone="error">{notice}</Notice>}
      </>
    );
  }

  const link = inviteLink(origin, seat.room.code);
  return (
    <Lobby
      seat={seat}
      link={link}
      shared={shared.value}
      error={notice}
      removing={removing.value}
      onShare={async () => {
        shared.value = await shareInvite(link, navigator);
      }}
      onStart={connection.start}
      onLeave={connection.leave}
      onAskRemove={(bowlerId) => {
        removing.value = bowlerId;
      }}
      onCancelRemove={() => {
        removing.value = undefined;
      }}
      onRemove={(bowlerId) => {
        removing.value = undefined;
        connection.remove(bowlerId);
      }}
    />
  );
};
