import { effect } from "@preact/signals";
import { render } from "preact";
import { App } from "./app.js";
import { createConnection } from "./connection.js";
import { DesktopGate, isDesktop } from "./desktop-gate.js";
import { codeFromPath } from "./invite.js";
import "./styles.css";

const root = document.getElementById("app");
const desktop = isDesktop({
  touch:
    navigator.maxTouchPoints > 0 || matchMedia("(pointer: coarse)").matches,
  width: window.innerWidth,
});

if (root && desktop) {
  render(<DesktopGate url={location.href} />, root);
} else if (root) {
  const scheme = location.protocol === "https:" ? "wss" : "ws";
  const initialCode = codeFromPath(location.pathname);
  const connection = createConnection(
    () => new WebSocket(`${scheme}://${location.host}/ws`),
    Date.now,
    { invitedTo: initialCode },
  );
  effect(() => {
    const code = connection.seat.value?.room.code;
    if (code && location.pathname !== `/${code}`) {
      history.replaceState(null, "", `/${code}`);
    }
    if (connection.closed.value) {
      history.replaceState(null, "", "/");
    }
  });
  render(
    <App
      connection={connection}
      initialCode={initialCode}
      origin={location.origin}
    />,
    root,
  );
}
