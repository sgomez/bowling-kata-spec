import type { BowlerView } from "@bowling/domain";

const FRAME_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const Scorecard = ({ bowlers }: { bowlers: readonly BowlerView[] }) => (
  <div class="scorecard">
    <table>
      <thead>
        <tr>
          <th scope="col">Jugador</th>
          {FRAME_NUMBERS.map((n) => (
            <th scope="col" key={n}>
              {n}
            </th>
          ))}
          <th scope="col">Total</th>
        </tr>
      </thead>
      <tbody>
        {bowlers.map((bowler) => (
          <tr key={bowler.id}>
            <th scope="row">{bowler.nickname}</th>
            {bowler.frames.map((frame, i) => (
              <td key={FRAME_NUMBERS[i]}>
                <span class="rolls">{frame.rolls.join(" ")}</span>
                <span class="score">{frame.score}</span>
              </td>
            ))}
            <td class="total">{bowler.total}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
