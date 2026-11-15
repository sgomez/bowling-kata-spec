import { secondsLeft, useTick } from "./countdown.js";
import { HomeHero } from "./home-hero.js";
import { Icon } from "./ui.js";
import "./styles/home.css";
import "./styles/notices.css";
import { RETRY, SPINNER } from "./icons.js";

const SERVER =
  "M5 4h14a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM5 13h14a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2zM7 7.5h.01M7 16.5h.01";

interface ReconnectingProps {
  attempt: number;
  nextAt: number;
  now: () => number;
}

export const Reconnecting = ({ attempt, nextAt, now }: ReconnectingProps) => {
  useTick();
  return (
    <div class="reconnecting">
      <div role="status" class="reconnecting-card">
        <Icon class="reconnecting-spinner" d={SPINNER} />
        <p class="reconnecting-title">Reconectando…</p>
        <p>
          Se ha cortado la conexión. Lo intentamos de nuevo automáticamente.
        </p>
        <p class="reconnecting-attempt">
          Intento {attempt} · siguiente en {secondsLeft(nextAt, now)} s
        </p>
      </div>
    </div>
  );
};

export const ServerRestart = () => (
  <main class="restart">
    <HomeHero />
    <h1 class="home-title">Bolos</h1>
    <div role="alert" class="restart-message">
      <span class="restart-icon">
        <Icon d={SERVER} />
      </span>
      <p>El servidor se está reiniciando. Vuelve a entrar en un momento.</p>
    </div>
    <a class="button button-secondary" href="/">
      <Icon d={RETRY} />
      Volver al inicio
    </a>
  </main>
);
