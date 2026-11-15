import { kindOfMark, standingAfter } from "./roll-kind.js";

const describe = (rolls: readonly string[]) => {
  const last = rolls.at(-1) ?? "";
  const kind = kindOfMark(last);
  if (kind === "strike") return { kind, symbol: "X", label: "¡Pleno!" };
  if (kind === "spare") return { kind, symbol: "/", label: "¡Semipleno!" };
  if (kind === "zero") {
    return { kind, symbol: "–", label: "Al canal", detail: "Cero bolos" };
  }
  const pins = Number(last);
  const left = standingAfter(rolls);
  return {
    kind,
    symbol: last,
    label: pins === 1 ? "bolo" : "bolos",
    detail: left === 1 ? "Queda 1 en pie" : `Quedan ${left} en pie`,
  };
};

export const RollOutcome = ({
  rolls,
  fleeting = false,
}: {
  rolls: readonly string[];
  fleeting?: boolean;
}) => {
  if (rolls.length === 0) return null;
  const { kind, symbol, label, detail } = describe(rolls);
  return (
    // Keyed by Roll, so each one plays its entrance afresh.
    <div
      key={rolls.length}
      class={`outcome ${kind}${fleeting ? " fleeting" : ""}`}
      role="status"
    >
      <span class="outcome-symbol">{symbol}</span>
      <span class="outcome-label">{label}</span>
      {detail && <span class="outcome-detail">{detail}</span>}
    </div>
  );
};
