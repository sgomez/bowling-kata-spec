import { useSignal } from "@preact/signals";
import { Final } from "./final.js";
import { Home } from "./home.js";
import { inviteLink, type ShareOutcome, shareInvite } from "./invite.js";
import { Lobby } from "./lobby.js";
import { errorMessage } from "./messages.js";
import { Play } from "./play.js";
import type { Session } from "./session.js";

const SHARE_NOTICES: Record<ShareOutcome, string | undefined> = {
  shared: undefined,
  dismissed: undefined,
  copied: "Enlace copiado.",
  failed: "No se ha podido compartir; copia el enlace a mano.",
};

interface AppProps {
  session: Session;
  initialCode: string;
  origin: string;
}

export const App = ({ session, initialCode, origin }: AppProps) => {
  const shareNotice = useSignal<string | undefined>(undefined);
  const seat = session.seat.value;
  const error = session.error.value;

  if (!seat) {
    return (
      <Home
        initialCode={initialCode}
        error={
          session.removed.value
            ? "El anfitrión te ha sacado de la sala."
            : error && errorMessage(error)
        }
        onCreate={session.create}
        onJoin={session.join}
      />
    );
  }

  const notice = error && errorMessage(error);
  if (seat.room.phase === "finished") {
    return <Final seat={seat} onRematch={session.rematch} />;
  }
  if (seat.room.frame) {
    return (
      <>
        <Play seat={seat} frame={seat.room.frame} onRoll={session.roll} />
        {notice && <p role="alert">{notice}</p>}
        <button type="button" onClick={session.leave}>
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
      onStart={session.start}
      onLeave={session.leave}
      onRemove={session.remove}
    />
  );
};
