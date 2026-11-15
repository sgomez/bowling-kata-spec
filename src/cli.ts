import { stdin as defaultStdin, stdout as defaultStdout } from "node:process";
import * as readline from "node:readline/promises";
import { Game } from "./domain/game.js";
import { formatScorecard } from "./presentation/scorecard.js";

export async function runCli(
  input: NodeJS.ReadableStream = defaultStdin,
  output: NodeJS.WritableStream = defaultStdout,
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
      output.write(`\n${formatScorecard(game)}\n\n`);

      while (!game.isComplete()) {
        const prompt = `Marco ${game.currentFrame}, Lanzamiento ${game.currentRoll}: `;
        const answer = await ask(prompt);
        if (answer === null) {
          return;
        }

        const trimmed = answer.trim();
        const lower = trimmed.toLowerCase();

        if (lower === "undo" || lower === "u") {
          if (!game.canUndo()) {
            output.write("No hay lanzamientos para deshacer.\n");
            continue;
          }
          game.undo();
          output.write(`\n${formatScorecard(game)}\n\n`);
          continue;
        }

        const validation = game.validateRoll(trimmed);
        if (!validation.valid) {
          switch (validation.failure.type) {
            case "STRIKE_ON_SECOND_ROLL":
              output.write(
                "No se puede registrar un strike ('X') en el segundo lanzamiento.\n",
              );
              break;
            case "STRIKE_FEWER_PINS":
              output.write(
                "No se puede registrar un strike ('X') cuando quedan menos de 10 bolos.\n",
              );
              break;
            case "SPARE_ON_FIRST_ROLL":
              output.write(
                "No se puede registrar un spare ('/') en el primer lanzamiento.\n",
              );
              break;
            case "SPARE_ON_FRESH_RACK":
              output.write(
                "No se puede registrar un spare ('/') con todos los bolos en pie.\n",
              );
              break;
            case "EXCEEDS_REMAINING_PINS":
              output.write(
                `El total de bolos en el marco no puede superar 10 (bolos restantes: ${validation.failure.remainingPins}).\n`,
              );
              break;
            default:
              output.write(
                "Por favor, introduce un número válido de bolos (0-10), 'X', '/' o '-'.\n",
              );
              break;
          }
          continue;
        }

        game.roll(validation.pins);
        output.write(`\n${formatScorecard(game)}\n\n`);
      }

      output.write(
        `¡Partida finalizada! Puntuación final: ${game.score()}\n\n`,
      );
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
