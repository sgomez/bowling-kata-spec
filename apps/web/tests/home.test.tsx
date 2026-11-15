import { render } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { Home } from "../src/home.js";

const noop = () => {};

describe("home screen", () => {
  it("offers to create a Room or join one with a code and nickname", () => {
    const html = render(<Home initialCode="" onCreate={noop} onJoin={noop} />);

    expect(html).toContain("Tu apodo");
    expect(html).toContain("Crear sala");
    expect(html).toContain("Código de sala");
    expect(html).toContain("Unirse");
    expect(html).toContain('maxlength="16"');
  });

  it("pre-fills the Room Code from an Invite Link", () => {
    const html = render(
      <Home initialCode="K7MPQ" onCreate={noop} onJoin={noop} />,
    );

    expect(html).toContain('value="K7MPQ"');
  });

  it("explains why the last request was refused", () => {
    const html = render(
      <Home
        initialCode=""
        error="La sala está completa: ya hay seis jugadores."
        onCreate={noop}
        onJoin={noop}
      />,
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("La sala está completa: ya hay seis jugadores.");
  });
});
