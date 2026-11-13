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
      "10\n",  // > 9 for ticket 2 open frame
      "4\n",   // valid roll 1
      "7\n",   // sum 4 + 7 >= 10 invalid open frame
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

    expect(outputText).toContain("Por favor, introduce un número válido de bolos (0-9).");
    expect(outputText).toContain("En un marco abierto, el total debe ser menor a 10");
    expect(outputText).toContain("¡Partida finalizada! Puntuación final: 9");
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
