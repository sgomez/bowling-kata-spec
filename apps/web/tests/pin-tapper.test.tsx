import { render } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { PinTapper, toggle } from "../src/pin-tapper.js";

const noop = () => {};

describe("tapping Pins to Roll", () => {
  it("offers only the standing Pins", () => {
    const html = render(<PinTapper standing={[3, 5, 6]} onRoll={noop} />);

    expect(html).toMatch(/aria-label="Bolo 3"(?![^>]*disabled)/);
    expect(html).toMatch(/aria-label="Bolo 1"[^>]*disabled/);
    expect(html).toContain("Lanzar (0 bolos)");
  });

  it("selects and unselects a Pin with each tap", () => {
    expect(toggle([], 4)).toEqual([4]);
    expect(toggle([4, 7], 4)).toEqual([7]);
  });
});
