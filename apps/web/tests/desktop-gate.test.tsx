import { render } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { DesktopGate, isDesktop } from "../src/desktop-gate.js";

describe("mobile gate", () => {
  it.each([
    [{ touch: false, width: 1280 }, true],
    [{ touch: false, width: 768 }, true],
    [{ touch: false, width: 767 }, false],
    [{ touch: true, width: 1280 }, false],
    [{ touch: true, width: 390 }, false],
  ])("treats %o as desktop: %s", (viewport, expected) => {
    expect(isDesktop(viewport)).toBe(expected);
  });

  it("shows the logo and a QR code of the current URL to continue on a phone", () => {
    const html = render(<DesktopGate url="https://bolos.example/K7MPQ" />);

    expect(html).toContain("Bolos</h1>");
    expect(html).toContain("<svg");
    expect(html).toContain("Abre esta página en tu móvil para jugar.");
    expect(html).toContain("Escanea el código o escribe");
    expect(html).toContain("Solo para móvil, en vertical");
  });

  it("writes the address without the scheme", () => {
    const html = render(<DesktopGate url="https://bolos.example/K7MPQ" />);

    expect(html).toContain(">bolos.example/K7MPQ<");
    expect(html).not.toContain("https://bolos.example");
  });

  it("drops the trailing slash of a bare address", () => {
    const html = render(<DesktopGate url="https://bolos.example/" />);

    expect(html).toContain(">bolos.example<");
  });
});
