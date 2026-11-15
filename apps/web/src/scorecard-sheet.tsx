import type { BowlerId, BowlerView } from "@bowling/domain";
import { useState } from "preact/hooks";
import { Scorecard, ScorecardLegend } from "./scorecard.js";
import { Icon } from "./ui.js";

const CLOSE = "M18 6 6 18M6 6l12 12";
const SCORECARD = "M3 4h18v16H3zM3 10h18M9 4v16";
const LEAVE_MS = 180;

interface ScorecardProps {
  you: BowlerId;
  bowlers: readonly BowlerView[];
}

type ScorecardSheetProps = ScorecardProps & {
  closing?: boolean;
  onClose: () => void;
};

export const ScorecardSheet = ({
  you,
  bowlers,
  closing,
  onClose,
}: ScorecardSheetProps) => (
  <div class={closing ? "scrim closing" : "scrim"}>
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scorecard-title"
      class="sheet"
    >
      <button
        type="button"
        class="sheet-close"
        aria-label="Cerrar marcador"
        onClick={onClose}
      >
        <Icon d={CLOSE} />
      </button>
      <h2 id="scorecard-title">Marcador</h2>
      <ScorecardLegend />
      <Scorecard you={you} bowlers={bowlers} />
    </div>
  </div>
);

export const ScorecardButton = (props: ScorecardProps) => {
  const [sheet, setSheet] = useState<"open" | "closing">();
  const close = () => {
    setSheet("closing");
    setTimeout(() => setSheet(undefined), LEAVE_MS);
  };
  return (
    <>
      <button
        type="button"
        class="reveal-scorecard"
        onClick={() => setSheet("open")}
      >
        <Icon d={SCORECARD} />
        Ver marcador completo
      </button>
      {sheet && (
        <ScorecardSheet
          {...props}
          closing={sheet === "closing"}
          onClose={close}
        />
      )}
    </>
  );
};
