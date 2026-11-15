import { render } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { Avatar, Button, Chip, Field, Notice, Toast } from "../src/ui.js";

describe("base components", () => {
  it("shows a busy button as waiting, not pressable", () => {
    const html = render(
      <Button variant="primary" busy="Conectando…">
        Crear sala
      </Button>,
    );

    expect(html).toContain("Conectando…");
    expect(html).not.toContain("Crear sala");
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("disabled");
  });

  it("labels a field's input", () => {
    const html = render(<Field label="Tu apodo" name="nickname" value="" />);

    expect(html).toMatch(/<label for="nickname"[^>]*>Tu apodo<\/label>/);
    expect(html).toContain('id="nickname"');
  });

  it("shows a chip's text", () => {
    expect(render(<Chip tone="warning">sala completa</Chip>)).toContain(
      "sala completa",
    );
  });

  it("raises an error notice as an alert and anything else as a status", () => {
    expect(render(<Notice tone="error">No existe.</Notice>)).toContain(
      'role="alert"',
    );
    expect(render(<Notice tone="info">Te han invitado.</Notice>)).toContain(
      'role="status"',
    );
  });

  const toast = (at: number) =>
    render(
      <Toast tone="success" since={1_000} now={() => at}>
        Enlace copiado.
      </Toast>,
    );

  it("announces a toast politely", () => {
    const html = toast(1_000);

    expect(html).toContain('role="status"');
    expect(html).toContain("Enlace copiado.");
  });

  it("keeps a toast on screen while it leaves", () => {
    expect(toast(4_100)).toContain("Enlace copiado.");
  });

  it("drops a toast once it has left", () => {
    expect(toast(4_180)).toBe("");
  });

  it("draws an avatar as the nickname's first two letters, upper-cased", () => {
    expect(render(<Avatar nickname="marta" colour={0} />)).toMatch(/>MA</);
    expect(render(<Avatar nickname="Ñu" colour={0} />)).toMatch(/>ÑU</);
  });

  it("paints every Bowler Colour differently", () => {
    const colours = [0, 1, 2, 3, 4, 5] as const;
    const avatars = colours.map((colour) =>
      render(<Avatar nickname="Ana" colour={colour} />),
    );

    expect(new Set(avatars).size).toBe(colours.length);
  });
});
