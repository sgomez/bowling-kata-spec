import { render } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { CelebrationOverlay } from "../src/celebration-overlay.js";

describe("the Strike's overlay", () => {
  it("is hidden from readers", () => {
    expect(render(<CelebrationOverlay />)).toMatch(
      /^<div[^>]*aria-hidden="true"/,
    );
  });
});
