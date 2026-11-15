import { Readable, Writable } from "node:stream";
import { describe, expect, it } from "vitest";
import { runCli } from "../../src/cli.js";

describe("runCli Notation", () => {
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

  it("handles '-' notation for 0 pins in CLI loop", async () => {
    // Frame 1: "-" (0 pins), "7" (7 pins) -> Marco 2
    // Frame 2-10: 18 rolls of "-"
    // 'n' to exit
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
    // Frame 1: 0, / (spare of 10 pins)
    // Frame 2: 7, 2 (open frame, 9 pins)
    // Remaining 16 rolls as gutters
    // 'n' to exit
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
    // Score: Frame 1 = 10 + 7 = 17. Frame 2 = 17 + 9 = 26.
    expect(outputText).toContain("¡Partida finalizada! Puntuación final: 26");
  });
});
