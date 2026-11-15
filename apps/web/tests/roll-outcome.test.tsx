import { render } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { RollOutcome } from "../src/roll-outcome.js";

describe("the outcome of a Foul", () => {
  it("says Foul instead of a gutter ball", () => {
    const html = render(<RollOutcome rolls={["F"]} />);

    expect(html).toMatch(/F.*Falta.*Has pasado la línea/s);
    expect(html).not.toContain("Al canal");
  });

  it("counts a Foul as no Pins knocked", () => {
    const html = render(<RollOutcome rolls={["7", "F"]} />);

    expect(html).toMatch(/Falta/);
    expect(render(<RollOutcome rolls={["F", "7"]} />)).toContain(
      "Quedan 3 en pie",
    );
  });
});
