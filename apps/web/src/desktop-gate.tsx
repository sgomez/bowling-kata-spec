import { renderSVG } from "uqr";

const MIN_DESKTOP_WIDTH = 768;

export const isDesktop = ({
  touch,
  width,
}: {
  touch: boolean;
  width: number;
}) => !touch && width >= MIN_DESKTOP_WIDTH;

export const DesktopGate = ({ url }: { url: string }) => (
  <main class="desktop-gate">
    <h1>Bolos</h1>
    <p>Abre esta página en tu móvil para jugar.</p>
    <div class="qr" dangerouslySetInnerHTML={{ __html: renderSVG(url) }} />
    <p class="url">{url}</p>
  </main>
);
