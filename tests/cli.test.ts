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
    expect(outputText).toContain(
      "+-----+-----+-----+-----+-----+-----+-----+-----+-----+--------+",
    );
    expect(outputText).toContain("¡Partida finalizada! Puntuación final: 20");
    expect(outputText).toContain("¿Deseas jugar otra partida?");
    expect(outputText).toContain("¡Gracias por jugar!");
  });

  it("handles invalid inputs with Spanish error messages and re-prompts", async () => {
    // Attempt invalid string, then out of range, then valid rolls
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

  describe("Tenth Frame CLI Game Loop", () => {
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
      expect(outputText).toContain(
        "¡Partida finalizada! Puntuación final: 300",
      );
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

      expect(outputText).toContain(
        "¡Partida finalizada! Puntuación final: 200",
      );
    });
  });

  describe("Undo and Shorthand '-' in CLI", () => {
    it("handles '-' shorthand notation for 0 pins in CLI loop", async () => {
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

    it("displays polite message when undo is attempted on empty history", async () => {
      const inputs = [
        "undo\n", // no rolls yet
        "u\n", // shorthand u on empty history
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
      // Frame 1, roll 1: 5
      // User types 'undo' -> should revert to Frame 1, roll 1
      // User rolls 4, then 3 -> Frame 1 complete (total 7)
      // Remaining 18 rolls as gutters
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

    it("supports 'u' shorthand for undo across frame boundaries", async () => {
      // Frame 1: strike 'X' -> advances to Marco 2, roll 1
      // User types 'u' -> reverts strike, prompts Marco 1, roll 1
      // Frame 1: rolls 8, 1 -> Frame 1 complete (score 9)
      // Remaining 18 rolls as gutters
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
      // Frames 1-9: gutters
      // Frame 10: X, X (prompts roll 3)
      // 'UNDO' -> reverts roll 2, prompts roll 2
      // 'u' -> reverts roll 1, prompts roll 1
      // User rolls 7, 2 (open frame, game completes with score 9)
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

  describe("Standards and Edge Case Validation Regressions", () => {
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

    it("rejects 'X' on roll 2 after a 0-pin first roll in frames 1-9 and uses 'strike' terminology", async () => {
      // Frame 1, roll 1: 0
      // Frame 1, roll 2: X (invalid, should reject with Spanish message using 'strike')
      // Frame 1, roll 2 re-prompt: 5
      // Remaining 18 rolls as gutters
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
});
