import { Game } from "../domain/game.js";

function centerText(text: string, width: number): string {
  if (text.length >= width) {
    return text.slice(0, width);
  }
  const targetStart = Math.floor((width + text.length) / 2);
  return text.padStart(targetStart).padEnd(width);
}

function formatRoll(pins: number | undefined): string {
  if (pins === undefined) {
    return "  ";
  }
  return pins.toString().padStart(2);
}

export function formatScorecard(game: Game): string {
  const frames = game.frames;

  const topDivider = "+-----+-----+-----+-----+-----+-----+-----+-----+-----+--------+";

  const headerCells = frames.map((f) => {
    if (f.frameNumber === 10) {
      return centerText("10", 8);
    }
    return centerText(f.frameNumber.toString(), 5);
  });
  const headerRow = `|${headerCells.join("|")}|`;

  const rollCells = frames.map((f) => {
    if (f.frameNumber === 10) {
      const r1 = formatRoll(f.rolls[0]);
      const r2 = formatRoll(f.rolls[1]);
      const r3 = formatRoll(f.rolls[2]);
      return `${r1}|${r2}|${r3}`;
    }
    const r1 = formatRoll(f.rolls[0]);
    const r2 = formatRoll(f.rolls[1]);
    return `${r1}|${r2}`;
  });
  const rollsRow = `|${rollCells.join("|")}|`;

  const scoreCells = frames.map((f) => {
    const width = f.frameNumber === 10 ? 8 : 5;
    if (f.cumulativeScore === null) {
      return " ".repeat(width);
    }
    return centerText(f.cumulativeScore.toString(), width);
  });
  const scoreRow = `|${scoreCells.join("|")}|`;

  return [topDivider, headerRow, topDivider, rollsRow, topDivider, scoreRow, topDivider].join(
    "\n"
  );
}
