import { Readable, Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { runCli } from "../../src/cli.js";

describe("runCli validation", () => {
  it("handles invalid inputs with Spanish error messages and re-prompts", async () => {
    const inputs = [
      "abc\n", // invalid non-number
      "-1\n", // out of range
      "11\n", // > 10 out of range
      "4\n", // valid roll 1
      "7\n", // sum 4 + 7 = 11 > 10 invalid
      "5\n", // valid roll 2 (sum 4+5 = 9)
      ...Array(18).fill("0\n"), // remaining 18 rolls as gutters
      "n\n",
    ];
    const inStream = Readable.from(inputs);

    let outputText = "";
    const outStream = new Writable({
      write(chunk, _encoding, callback) {
        outputText += chunk.toString();
        callback();
      },
    });

    await runCli(inStream, outStream);

    expect(outputText).toContain(
      "Por favor, introduce un número válido de bolos (0-10), 'X', '/' o '-'.",
    );
    expect(outputText).toContain(
      "El total de bolos en el marco no puede superar 10",
    );
    expect(outputText).toContain("¡Partida finalizada! Puntuación final: 9");
  });

  it("rejects 'X' on roll 2 after a 0-pin first roll in frames 1-9 and uses 'strike' terminology", async () => {
    const inputs = ["0\n", "X\n", "5\n", ...Array(18).fill("0\n"), "n\n"];
    const inStream = Readable.from(inputs);

    let outputText = "";
    const outStream = new Writable({
      write(chunk, _encoding, callback) {
        outputText += chunk.toString();
        callback();
      },
    });

    await runCli(inStream, outStream);

    expect(outputText).toContain(
      "No se puede registrar un strike ('X') en el segundo lanzamiento.",
    );
    expect(outputText.toLowerCase()).not.toContain("pleno");
    expect(outputText).toContain("¡Partida finalizada! Puntuación final: 5");
  });

  it("rejects '/' on roll 1 and uses 'spare' terminology", async () => {
    const inputs = ["/\n", "4\n", "5\n", ...Array(18).fill("0\n"), "n\n"];
    const inStream = Readable.from(inputs);

    let outputText = "";
    const outStream = new Writable({
      write(chunk, _encoding, callback) {
        outputText += chunk.toString();
        callback();
      },
    });

    await runCli(inStream, outStream);

    expect(outputText).toContain(
      "No se puede registrar un spare ('/') en el primer lanzamiento.",
    );
    expect(outputText.toLowerCase()).not.toContain("semipleno");
    expect(outputText).toContain("¡Partida finalizada! Puntuación final: 9");
  });
});
