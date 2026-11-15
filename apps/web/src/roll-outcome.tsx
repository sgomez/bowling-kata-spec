const RACK = 10;

const pinsOf = (roll: string) => (roll === "-" ? 0 : Number(roll));

const leftAfter = (rolls: readonly string[]) => {
  let left = RACK;
  let first: number | undefined;
  for (const roll of rolls) {
    if (roll === "X" || roll === "/") {
      first = undefined;
    } else if (first === undefined) {
      first = pinsOf(roll);
      left = RACK - first;
    } else {
      left = RACK - first - pinsOf(roll);
      first = undefined;
    }
  }
  return left;
};

const describe = (rolls: readonly string[]) => {
  const last = rolls.at(-1);
  if (last === "X") return { kind: "strike", symbol: "X", label: "¡Pleno!" };
  if (last === "/") return { kind: "spare", symbol: "/", label: "¡Semipleno!" };
  if (last === "-") {
    return {
      kind: "zero",
      symbol: "–",
      label: "Al canal",
      detail: "Cero bolos",
    };
  }
  const pins = Number(last);
  const left = leftAfter(rolls);
  return {
    kind: "count",
    symbol: last,
    label: pins === 1 ? "bolo" : "bolos",
    detail: left === 1 ? "Queda 1 en pie" : `Quedan ${left} en pie`,
  };
};

export const RollOutcome = ({ rolls }: { rolls: readonly string[] }) => {
  if (rolls.length === 0) return null;
  const { kind, symbol, label, detail } = describe(rolls);
  return (
    <div class={`outcome ${kind}`} role="status">
      <span class="outcome-symbol">{symbol}</span>
      <span class="outcome-label">{label}</span>
      {detail && <span class="outcome-detail">{detail}</span>}
    </div>
  );
};
