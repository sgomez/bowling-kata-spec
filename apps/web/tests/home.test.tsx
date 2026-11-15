import { render } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { Home } from "../src/home.js";

describe("home screen", () => {
  it("greets the Bowler in Spanish", () => {
    const html = render(<Home />);

    expect(html).toContain("Bolos");
    expect(html).toContain("Muy pronto podrás jugar con tus amigos.");
  });
});
