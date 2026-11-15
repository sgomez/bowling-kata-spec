import { useSignal } from "@preact/signals";
import { Home } from "./home.js";
import { inviteLink, type ShareOutcome, shareInvite } from "./invite.js";
import { Lobby } from "./lobby.js";
import { errorMessage } from "./messages.js";
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
        error={error && errorMessage(error)}
        onCreate={session.create}
        onJoin={session.join}
      />
    );
  }

  const link = inviteLink(origin, seat.room.code);
  return (
    <Lobby
      seat={seat}
      link={link}
      shareNotice={shareNotice.value ?? (error && errorMessage(error))}
      onShare={async () => {
        shareNotice.value = SHARE_NOTICES[await shareInvite(link, navigator)];
      }}
      onStart={session.start}
    />
  );
};
