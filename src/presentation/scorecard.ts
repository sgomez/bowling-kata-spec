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
  if (pins === 0) {
    return " -";
  }
  return pins.toString().padStart(2);
}

function formatTenthFrameRoll(
  rollIndex: number,
  rolls: readonly number[]
): string {
  const pins = rolls[rollIndex];
  if (pins === undefined) {
    return "  ";
  }

  if (rollIndex === 0) {
    if (pins === 10) {
      return " X";
    }
    return formatRoll(pins);
  }

  if (rollIndex === 1) {
    if (rolls[0] === 10) {
      if (pins === 10) {
        return " X";
      }
      return formatRoll(pins);
    }
    if (rolls[0] + pins === 10) {
      return " /";
    }
    return formatRoll(pins);
  }

  if (rollIndex === 2) {
    if (rolls[0] === 10) {
      if (rolls[1] === 10) {
        return pins === 10 ? " X" : formatRoll(pins);
      }
      return rolls[1] + pins === 10 ? " /" : formatRoll(pins);
    }
    // rolls[0] < 10, rolls[1] was spare
    if (pins === 10) {
      return " X";
    }
    return formatRoll(pins);
  }

  return formatRoll(pins);
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
      const r1 = formatTenthFrameRoll(0, f.rolls);
      const r2 = formatTenthFrameRoll(1, f.rolls);
      const r3 = formatTenthFrameRoll(2, f.rolls);
      return `${r1}|${r2}|${r3}`;
    }

    if (f.rolls.length === 1 && f.rolls[0] === 10) {
      return "  | X";
    }

    if (f.rolls.length === 2 && f.rolls[0] + f.rolls[1] === 10) {
      return `${formatRoll(f.rolls[0])}| /`;
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
