import { useSignal } from "@preact/signals";
import { Final } from "./final.js";
import { Home } from "./home.js";
import { inviteLink, type ShareOutcome, shareInvite } from "./invite.js";
import { Lobby } from "./lobby.js";
import { closedMessage, errorMessage } from "./messages.js";
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
  const closed = session.closed.value;

  if (!seat) {
    return (
      <Home
        initialCode={closed ? "" : initialCode}
        error={closed ? closedMessage(closed) : error && errorMessage(error)}
        onCreate={session.create}
        onJoin={session.join}
      />
    );
  }

  const notice = error && errorMessage(error);
  if (seat.room.phase === "finished") {
    return <Final room={seat.room} />;
  }
  if (seat.room.frame) {
    return (
      <>
        <Play seat={seat} frame={seat.room.frame} onRoll={session.roll} />
        {notice && <p role="alert">{notice}</p>}
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
    />
  );
};
