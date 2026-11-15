import { render } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { Home } from "../src/home.js";

const noop = () => {};

const boxes = (html: string) =>
  [...html.matchAll(/<input[^>]*aria-label="Carácter \d de 5"[^>]*>/g)].map(
    ([box]) => box.match(/value="([^"]*)"/)?.[1] ?? "",
  );

describe("home screen", () => {
  it("offers to create a Room or join one with a code and nickname", () => {
    const html = render(<Home initialCode="" onCreate={noop} onJoin={noop} />);

    expect(html).toContain("Tu apodo");
    expect(html).toContain('maxlength="16"');
    expect(html).toContain("Crear sala");
    expect(html).toContain("o únete a la de un amigo");
    expect(html).toContain("Código de sala");
    expect(html).toContain("Unirse");
    expect(html.indexOf("Crear sala")).toBeLessThan(html.indexOf("Unirse"));
  });

  it("asks for the Room Code in five boxes", () => {
    const html = render(<Home initialCode="" onCreate={noop} onJoin={noop} />);

    expect(boxes(html)).toEqual(["", "", "", "", ""]);
    expect(html).toContain('autocapitalize="characters"');
  });

  it("fills the boxes from an Invite Link and puts joining first", () => {
    const html = render(
      <Home initialCode="K7MPQ" onCreate={noop} onJoin={noop} />,
    );

    expect(boxes(html)).toEqual(["K", "7", "M", "P", "Q"]);
    expect(html).toContain("Te han invitado a la sala");
    expect(html).toContain("Elige un apodo para entrar.");
    expect(html).toMatch(/<input[^>]*autofocus[^>]*name="nickname"/);
    expect(html.indexOf("Unirse")).toBeLessThan(html.indexOf("Crear sala"));
  });

  it.each([
    ["create", "Unirse"],
    ["join", "Crear sala"],
  ] as const)("shows Conectando… while %s waits", (entering, other) => {
    const html = render(
      <Home initialCode="" entering={entering} onCreate={noop} onJoin={noop} />,
    );

    expect(html).toContain("Conectando…");
    expect(html).toContain(other);
    expect(html).toMatch(/<input[^>]*disabled[^>]*name="nickname"/);
  });

  it("explains a refusal in a notice under the form", () => {
    const html = render(
      <Home
        initialCode=""
        refusal={{
          text: "La sala está completa: ya hay seis jugadores.",
          tone: "error",
        }}
        onCreate={noop}
        onJoin={noop}
      />,
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("La sala está completa: ya hay seis jugadores.");
    expect(html.indexOf("Unirse")).toBeLessThan(html.indexOf('role="alert"'));
  });

  it("says nothing is kept and whose workshop it is", () => {
    const html = render(<Home initialCode="" onCreate={noop} onJoin={noop} />);

    expect(html).toContain("Sin registro: nada se guarda al terminar.");
    expect(html).toContain("Taller del Aula de Software Libre");
  });
});
