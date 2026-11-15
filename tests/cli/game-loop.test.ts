import { Readable, Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { runCli } from "../../src/cli.js";

describe("runCli game loop", () => {
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
    expect(outputText).toContain(
      "+-----+-----+-----+-----+-----+-----+-----+-----+-----+--------+",
    );
    expect(outputText).toContain("¡Partida finalizada! Puntuación final: 20");
    expect(outputText).toContain("¿Deseas jugar otra partida?");
    expect(outputText).toContain("¡Gracias por jugar!");
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

  it("displays Spanish scorecard header 'MARCO' in CLI loop output without forbidden synonyms", async () => {
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

    expect(outputText).toContain(
      "|                            MARCO                             |",
    );
    expect(outputText.toLowerCase()).not.toContain("pleno");
    expect(outputText.toLowerCase()).not.toContain("semipleno");
    expect(outputText.toLowerCase()).not.toContain("tiro extra");
  });
});
