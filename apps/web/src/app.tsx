import { useSignal } from "@preact/signals";
import type { Connection } from "./connection.js";
import { Final } from "./final.js";
import { Home } from "./home.js";
import { inviteLink, type ShareOutcome, shareInvite } from "./invite.js";
import { Lobby } from "./lobby.js";
import { closedMessage, errorMessage } from "./messages.js";
import { Play } from "./play.js";

const SHARE_NOTICES: Record<ShareOutcome, string | undefined> = {
  shared: undefined,
  dismissed: undefined,
  copied: "Enlace copiado.",
  failed: "No se ha podido compartir; copia el enlace a mano.",
};

interface AppProps {
  connection: Connection;
  initialCode: string;
  origin: string;
}

export const App = ({ connection, initialCode, origin }: AppProps) => {
  const shareNotice = useSignal<string | undefined>(undefined);
  const seat = connection.seat.value;
  const error = connection.error.value;
  const closed = connection.closed.value;

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
        onCreate={connection.create}
        onJoin={connection.join}
      />
    );
  }

  const notice = error && errorMessage(error);
  if (seat.room.phase === "finished") {
    return <Final seat={seat} onRematch={connection.rematch} />;
  }
  if (seat.room.frame) {
    return (
      <>
        <Play seat={seat} frame={seat.room.frame} onRoll={connection.roll} />
        {notice && <p role="alert">{notice}</p>}
        <button type="button" onClick={connection.leave}>
          Salir de la sala
        </button>
      </>
    );
  }

  const link = inviteLink(origin, seat.room.code);
  return (
    <Lobby
      seat={seat}
      link={link}
      shareNotice={shareNotice.value ?? notice}
      onShare={async () => {
        shareNotice.value = SHARE_NOTICES[await shareInvite(link, navigator)];
      }}
      onStart={connection.start}
      onLeave={connection.leave}
      onRemove={connection.remove}
    />
  );
};
