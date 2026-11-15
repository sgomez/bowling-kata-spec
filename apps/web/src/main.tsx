import { effect } from "@preact/signals";
import { render } from "preact";
import { App } from "./app.js";
import { DesktopGate, isDesktop } from "./desktop-gate.js";
import { codeFromPath } from "./invite.js";
import { createSession } from "./session.js";
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
  const session = createSession(
    () => new WebSocket(`${scheme}://${location.host}/ws`),
  );
  effect(() => {
    const code = session.seat.value?.room.code;
    if (code && location.pathname !== `/${code}`) {
      history.replaceState(null, "", `/${code}`);
    }
  });
  render(
    <App
      session={session}
      initialCode={codeFromPath(location.pathname)}
      origin={location.origin}
    />,
    root,
  );
}
