import { describe, it, expect } from "vitest";
import { Readable, Writable } from "node:stream";
import { runCli } from "../src/cli.js";

describe("runCli", () => {
  it("plays a full open-frame game of 20 ones and exits", async () => {
    // 20 rolls of '1', then 'n' to exit
    const inputs = [...Array(20).fill("1\n"), "n\n"];
    const inStream = Readable.from(inputs);

    let outputText = "";
    const outStream = new Writable({
      write(chunk, _encoding, callback) {
        outputText += chunk.toString();
        callback();
      },
    });

    await runCli(inStream, outStream);

    expect(outputText).toContain("Marco 1, Lanzamiento 1");
    expect(outputText).toContain("Marco 1, Lanzamiento 2");
    expect(outputText).toContain("Marco 10, Lanzamiento 2");
    expect(outputText).toContain("+-----+-----+-----+-----+-----+-----+-----+-----+-----+--------+");
    expect(outputText).toContain("¡Partida finalizada! Puntuación final: 20");
    expect(outputText).toContain("¿Deseas jugar otra partida?");
    expect(outputText).toContain("¡Gracias por jugar!");
  });

  it("handles invalid inputs with Spanish error messages and re-prompts", async () => {
    // Attempt invalid string, then out of range, then valid rolls
    const inputs = [
      "abc\n", // invalid non-number
      "-1\n",  // out of range
      "11\n",  // > 10 out of range
      "4\n",   // valid roll 1
      "7\n",   // sum 4 + 7 = 11 > 10 invalid
      "5\n",   // valid roll 2 (sum 4+5 = 9)
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

    expect(outputText).toContain("Por favor, introduce un número válido de bolos (0-10), 'X' o '/'.");
    expect(outputText).toContain("El total de bolos en el marco no puede superar 10");
    expect(outputText).toContain("¡Partida finalizada! Puntuación final: 9");
  });

  it("handles strikes ('X', 'x', '10') and spares ('/') in CLI game loop", async () => {
    // Frame 1: "X\n" (strike) -> advances to Marco 2, Lanzamiento 1
    // Frame 2: "7\n", "/\n" (spare) -> advances to Marco 3, Lanzamiento 1
    // Frame 3: "x\n" (strike) -> advances to Marco 4, Lanzamiento 1
    // Frame 4: "10\n" (strike) -> advances to Marco 5, Lanzamiento 1
    // Frame 5-10: 12 rolls of "0\n" (gutters)
    // Then "n\n"
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
    // Final score:
    // Frame 1: 10 + 7 + 3 = 20
    // Frame 2: 20 + 10 + 10 = 40
    // Frame 3: 40 + 10 + 10 + 0 = 60
    // Frame 4: 60 + 10 + 0 + 0 = 70
    // Frame 5-10: 0
    expect(outputText).toContain("¡Partida finalizada! Puntuación final: 70");
  });

  it("supports restarting game when player answers 's'", async () => {
    // Game 1: 20 gutters -> answer 's' to restart
    // Game 2: 20 ones -> answer 'n' to exit
    const inputs = [
      ...Array(20).fill("0\n"),
      "s\n",
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

    expect(outputText).toContain("¡Partida finalizada! Puntuación final: 0");
    expect(outputText).toContain("¡Partida finalizada! Puntuación final: 20");
    expect(outputText).toContain("¡Gracias por jugar!");
  });
});
