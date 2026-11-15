import { Readable, Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { runCli } from "../../src/cli.js";

describe("runCli Notation", () => {
  it("handles strikes ('X', 'x', '10') and spares ('/') in CLI game loop", async () => {
    const inputs = [
      "X\n",
      "7\n",
      "/\n",
      "x\n",
      "10\n",
      ...Array(12).fill("0\n"),
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

    expect(outputText).toContain("Marco 1, Lanzamiento 1: ");
    expect(outputText).toContain("Marco 2, Lanzamiento 1: ");
    expect(outputText).toContain("Marco 3, Lanzamiento 1: ");
    expect(outputText).toContain("Marco 4, Lanzamiento 1: ");
    expect(outputText).toContain("Marco 5, Lanzamiento 1: ");
    expect(outputText).toContain("¡Partida finalizada! Puntuación final: 70");
  });

  it("handles '-' notation for 0 pins in CLI loop", async () => {
    const inputs = ["-\n", "7\n", ...Array(18).fill("-\n"), "n\n"];
    const inStream = Readable.from(inputs);

    let outputText = "";
    const outStream = new Writable({
      write(chunk, _encoding, callback) {
        outputText += chunk.toString();
        callback();
      },
    });

    await runCli(inStream, outStream);

    expect(outputText).toContain("Marco 1, Lanzamiento 1: ");
    expect(outputText).toContain("Marco 1, Lanzamiento 2: ");
    expect(outputText).toContain(
      "| -| 7| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -| -|  |",
    );
    expect(outputText).toContain("¡Partida finalizada! Puntuación final: 7");
  });

  it("accepts '/' spare on roll 2 after a 0-pin first roll and advances frame", async () => {
    const inputs = [
      "0\n",
      "/\n",
      "7\n",
      "2\n",
      ...Array(16).fill("0\n"),
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

    expect(outputText).toContain("Marco 1, Lanzamiento 1: ");
    expect(outputText).toContain("Marco 1, Lanzamiento 2: ");
    expect(outputText).toContain("Marco 2, Lanzamiento 1: ");
    expect(outputText).not.toContain("No se puede registrar");
    expect(outputText).toContain("¡Partida finalizada! Puntuación final: 26");
  });
});
