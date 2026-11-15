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

  it("shows a QR code of the current URL to continue on a phone", () => {
    const html = render(<DesktopGate url="https://bolos.example/K7MPQ" />);

    expect(html).toContain("<svg");
    expect(html).toContain("Abre esta página en tu móvil");
    expect(html).toContain("https://bolos.example/K7MPQ");
  });
});
