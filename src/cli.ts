import * as readline from "node:readline/promises";
import { stdin as defaultStdin, stdout as defaultStdout } from "node:process";
import { Game } from "./domain/game.js";
import { formatScorecard } from "./presentation/scorecard.js";

export async function runCli(
  input: NodeJS.ReadableStream = defaultStdin,
  output: NodeJS.WritableStream = defaultStdout
): Promise<void> {
  const rl = readline.createInterface({
    input,
    output,
    terminal: false,
  });

  const lineIterator = rl[Symbol.asyncIterator]();

  async function ask(prompt: string): Promise<string | null> {
    output.write(prompt);
    const { value, done } = await lineIterator.next();
    if (done) {
      return null;
    }
    return value;
  }

  try {
    let playAgain = true;

    while (playAgain) {
      const game = new Game();
      output.write("\n" + formatScorecard(game) + "\n\n");

      while (!game.isComplete()) {
        const isTenthFrameBonus = game.currentFrame === 10 && game.currentRoll === 3;
        const prompt = isTenthFrameBonus
          ? "Marco 10, Lanzamiento 3 (tiro extra): "
          : `Marco ${game.currentFrame}, Lanzamiento ${game.currentRoll}: `;
        const answer = await ask(prompt);
        if (answer === null) {
          return;
        }

        const trimmed = answer.trim();
        const lower = trimmed.toLowerCase();
        const upper = trimmed.toUpperCase();

        if (lower === "undo" || lower === "u") {
          if (!game.canUndo()) {
            output.write("No hay lanzamientos para deshacer.\n");
            continue;
          }
          game.undo();
          output.write("\n" + formatScorecard(game) + "\n\n");
          continue;
        }

        if (trimmed === "-") {
          game.roll(0);
          output.write("\n" + formatScorecard(game) + "\n\n");
          continue;
        }

        if (upper === "X") {
          if (game.remainingPins !== 10) {
            if (game.currentFrame < 10 && game.currentRoll !== 1) {
              output.write("No se puede registrar un pleno ('X') en el segundo lanzamiento.\n");
            } else {
              output.write("No se puede registrar un pleno ('X') cuando quedan menos de 10 bolos.\n");
            }
            continue;
          }
          game.roll(10);
          output.write("\n" + formatScorecard(game) + "\n\n");
          continue;
        }

        if (upper === "/") {
          if (game.remainingPins === 10) {
            if (game.currentRoll === 1) {
              output.write("No se puede registrar un semipleno ('/') en el primer lanzamiento.\n");
            } else {
              output.write("No se puede registrar un semipleno ('/') con todos los bolos en pie.\n");
            }
            continue;
          }
          const remainingPins = game.remainingPins;
          game.roll(remainingPins);
          output.write("\n" + formatScorecard(game) + "\n\n");
          continue;
        }

        if (!/^\d+$/.test(trimmed)) {
          output.write("Por favor, introduce un número válido de bolos (0-10), 'X', '/' o '-'.\n");
          continue;
        }

        const pins = parseInt(trimmed, 10);
        if (pins < 0 || pins > 10) {
          output.write("Por favor, introduce un número válido de bolos (0-10), 'X', '/' o '-'.\n");
          continue;
        }

        if (pins > game.remainingPins) {
          output.write(
            `El total de bolos en el marco no puede superar 10 (bolos restantes: ${game.remainingPins}).\n`
          );
          continue;
        }

        game.roll(pins);
        output.write("\n" + formatScorecard(game) + "\n\n");
      }

      output.write(`¡Partida finalizada! Puntuación final: ${game.score()}\n\n`);
      const answer = await ask("¿Deseas jugar otra partida? (s/n): ");
      if (answer === null) {
        return;
      }
      const normalized = answer.trim().toLowerCase();
      if (normalized === "s" || normalized === "si" || normalized === "sí") {
        playAgain = true;
      } else {
        playAgain = false;
        output.write("¡Gracias por jugar!\n");
      }
    }
  } finally {
    rl.close();
  }
}

// Auto-run if executed directly as entrypoint
const isMain =
  process.argv[1] &&
  (import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1].endsWith("/src/cli.ts") ||
    process.argv[1].endsWith("/src/cli.js"));

if (isMain) {
  runCli().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
