import { render } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { CelebrationOverlay } from "../src/celebration-overlay.js";

describe("the Strike's overlay", () => {
  it("throws two beams and confetti in the neon colours, hidden from readers", () => {
    const html = render(<CelebrationOverlay />);

    expect(html).toContain('aria-hidden="true"');
    expect(html.match(/celebration-beam/g)).toHaveLength(2);
    expect(html.match(/celebration-confetti/g)?.length).toBeGreaterThan(10);
    expect(html).toContain("#3DE8FF");
  });
});
