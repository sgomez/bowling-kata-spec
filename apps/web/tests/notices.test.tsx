import { render } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { Reconnecting, ServerRestart } from "../src/notices.js";

describe("reconnecting layer", () => {
  it("shows the attempt and the seconds until the next one", () => {
    const html = render(
      <Reconnecting attempt={2} nextAt={12_400} now={() => 10_000} />,
    );

    expect(html).toContain("Reconectando…");
    expect(html).toContain("Se ha cortado la conexión.");
    expect(html).toContain("Intento 2 · siguiente en 3 s");
  });

  it("never counts below zero while the attempt is under way", () => {
    const html = render(
      <Reconnecting attempt={1} nextAt={10_000} now={() => 11_000} />,
    );

    expect(html).toContain("Intento 1 · siguiente en 0 s");
  });
});

describe("server restart notice", () => {
  it("tells the Bowler to come back and offers the way home", () => {
    const html = render(<ServerRestart />);

    expect(html).toContain("Bolos");
    expect(html).toContain(
      "El servidor se está reiniciando. Vuelve a entrar en un momento.",
    );
    expect(html).toMatch(/<a [^>]*href="\/"[^>]*>.*Volver al inicio<\/a>/s);
  });
});
