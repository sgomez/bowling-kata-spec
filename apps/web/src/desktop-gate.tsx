import { renderSVG } from "uqr";
import { HomeHero } from "./home-hero.js";
import { Icon } from "./ui.js";
import "./styles/home.css";
import "./styles/desktop-gate.css";

const MIN_DESKTOP_WIDTH = 768;
const PHONE =
  "M8.5 2h7A2.5 2.5 0 0 1 18 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 6 19.5v-15A2.5 2.5 0 0 1 8.5 2zM11 18h2";

export const isDesktop = ({
  touch,
  width,
}: {
  touch: boolean;
  width: number;
}) => !touch && width >= MIN_DESKTOP_WIDTH;

const address = (url: string) =>
  url.replace(/^[a-z]+:\/\//i, "").replace(/\/$/, "");

export const DesktopGate = ({ url }: { url: string }) => (
  <main class="desktop-gate">
    <div class="desktop-phone" aria-hidden="true">
      <HomeHero viewBox="0 0 390 844" />
    </div>
    <div class="desktop-content">
      <h1 class="desktop-title">Bolos</h1>
      <p class="desktop-lead">Abre esta página en tu móvil para jugar.</p>
      <div class="desktop-invite">
        <div
          class="desktop-qr"
          dangerouslySetInnerHTML={{ __html: renderSVG(url) }}
        />
        <div class="desktop-address">
          <span class="desktop-label">Escanea el código o escribe</span>
          <span class="desktop-url">{address(url)}</span>
          <span class="desktop-only">
            <Icon d={PHONE} />
            Solo para móvil, en vertical
          </span>
        </div>
      </div>
    </div>
  </main>
);
