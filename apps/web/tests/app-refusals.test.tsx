import { render } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { App } from "../src/app.js";
import { type ConnectionSocket, createConnection } from "../src/connection.js";

const connection = () => createConnection(() => ({}) as ConnectionSocket);

describe("refusals at home", () => {
  it("warns, rather than alarms, when there are too many Rooms", () => {
    const s = connection();
    s.error.value = "TOO_MANY_ROOMS";

    const html = render(<App webgl connection={s} initialCode="" origin="" />);

    expect(html).toMatch(
      /role="status"[^>]*>.*Ahora mismo hay demasiadas salas\./s,
    );
    expect(html).not.toContain('role="alert"');
  });

  it("marks the nickname field when the nickname is taken", () => {
    const s = connection();
    s.error.value = "NICKNAME_TAKEN";

    const html = render(<App webgl connection={s} initialCode="" origin="" />);

    expect(html).toMatch(/<input[^>]*aria-invalid="true"[^>]*name="nickname"/);
    expect(html).toContain("Ese apodo ya está cogido en la sala.");
  });

  it("leaves the nickname field alone for other refusals", () => {
    const s = connection();
    s.error.value = "UNKNOWN_ROOM";

    const html = render(<App webgl connection={s} initialCode="" origin="" />);

    expect(html).not.toContain("aria-invalid");
  });
});
