import { Readable, Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { runCli } from "../../src/cli.js";

describe("runCli Tenth Frame", () => {
  it("plays a perfect game (12 strikes, score 300) and displays tenth frame bonus prompt", async () => {
    const inputs = [...Array(12).fill("X\n"), "n\n"];
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
    expect(outputText).toContain(
      "|  | X|  | X|  | X|  | X|  | X|  | X|  | X|  | X|  | X| X| X| X|",
    );
    expect(outputText).toContain("¡Partida finalizada! Puntuación final: 300");
    expect(outputText).toContain("¿Deseas jugar otra partida? (s/n): ");
    expect(outputText).toContain("¡Gracias por jugar!");
  });

  it("plays a game ending with spare and bonus strike in tenth frame", async () => {
    const inputs = [...Array(18).fill("0\n"), "7\n", "/\n", "X\n", "n\n"];
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
    expect(outputText).toContain("¡Partida finalizada! Puntuación final: 20");
  });

  it("ends tenth frame strictly after 2 rolls on an open frame", async () => {
    const inputs = [...Array(18).fill("0\n"), "7\n", "2\n", "n\n"];
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
    expect(outputText).not.toContain("Marco 10, Lanzamiento 3");
    expect(outputText).toContain("¡Partida finalizada! Puntuación final: 9");
  });

  it("handles tenth frame validation rules in CLI loop", async () => {
    const inputs = [
      ...Array(18).fill("0\n"),
      "X\n", // Frame 10, roll 1: Strike
      "/\n", // Invalid spare when rack was reset
      "9\n", // Roll 2: 9 pins (1 pin remaining)
      "X\n", // Invalid strike on roll 3 (only 1 pin standing)
      "5\n", // Invalid pin count (5 > 1)
      "/\n", // Valid spare on roll 3
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
      "No se puede registrar un spare ('/') con todos los bolos en pie.",
    );
    expect(outputText).toContain(
      "No se puede registrar un strike ('X') cuando quedan menos de 10 bolos.",
    );
    expect(outputText).toContain(
      "El total de bolos en el marco no puede superar 10 (bolos restantes: 1).",
    );
    expect(outputText).toContain("¡Partida finalizada! Puntuación final: 20");
  });

  it("plays Dutch 200 game in CLI", async () => {
    const inputs = [
      "X\n",
      "9\n",
      "/\n",
      "X\n",
      "9\n",
      "/\n",
      "X\n",
      "9\n",
      "/\n",
      "X\n",
      "9\n",
      "/\n",
      "X\n",
      "9\n",
      "/\n",
      "10\n",
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

    expect(outputText).toContain("¡Partida finalizada! Puntuación final: 200");
  });
});
