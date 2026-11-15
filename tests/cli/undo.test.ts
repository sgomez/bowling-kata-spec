import { Readable, Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { runCli } from "../../src/cli.js";

describe("runCli undo", () => {
  it("displays polite message when undo is attempted on empty history", async () => {
    const inputs = [
      "undo\n", // no rolls yet
      "u\n", // alias u on empty history
      ...Array(20).fill("1\n"),
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

    expect(outputText).toContain("No hay lanzamientos para deshacer.");
    expect(outputText).toContain("¡Partida finalizada! Puntuación final: 20");
  });

  it("undoes the last roll and re-prompts for the reverted frame and roll", async () => {
    const inputs = [
      "5\n",
      "undo\n",
      "4\n",
      "3\n",
      ...Array(18).fill("0\n"),
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
    expect(outputText).toContain("¡Partida finalizada! Puntuación final: 7");
  });

  it("supports 'u' as an alias for undo across frame boundaries", async () => {
    const inputs = [
      "X\n",
      "u\n",
      "8\n",
      "1\n",
      ...Array(18).fill("0\n"),
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

    expect(outputText).toContain("Marco 2, Lanzamiento 1: ");
    expect(outputText).toContain("¡Partida finalizada! Puntuación final: 9");
  });

  it("supports multiple consecutive undos in the tenth frame", async () => {
    const inputs = [
      ...Array(18).fill("0\n"),
      "X\n",
      "X\n",
      "UNDO\n",
      "u\n",
      "7\n",
      "2\n",
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

    expect(outputText).toContain("Marco 10, Lanzamiento 1: ");
    expect(outputText).toContain("Marco 10, Lanzamiento 2: ");
    expect(outputText).toContain("Marco 10, Lanzamiento 3: ");
    expect(outputText).toContain("¡Partida finalizada! Puntuación final: 9");
  });
});
