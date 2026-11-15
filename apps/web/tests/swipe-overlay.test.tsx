import { render } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { SwipeGauge, SwipeHint } from "../src/swipe-overlay.js";

const straight = { release: 0, direction: 0, speed: 2, spin: 0 };
const gauge = (swipe = straight) => render(<SwipeGauge swipe={swipe} />);

describe("the swipe gauge", () => {
  it("rates the speed out of five", () => {
    expect(gauge({ ...straight, speed: 0.5 })).toContain("Velocidad: 1 de 5");
    expect(gauge({ ...straight, speed: 3 })).toContain("Velocidad: 3 de 5");
    expect(gauge({ ...straight, speed: 6 })).toContain("Velocidad: 5 de 5");
  });

  it("names the side the spin curves to", () => {
    expect(gauge({ ...straight, spin: -0.5 })).toContain("izquierda");
    expect(gauge({ ...straight, spin: 0.5 })).toContain("derecha");
    expect(gauge({ ...straight, spin: 0.02 })).toContain("sin efecto");
  });

  it("waits for a Swipe it can read", () => {
    const html = render(<SwipeGauge swipe={undefined} />);

    expect(html).toContain("Velocidad: 0 de 5");
    expect(html).toContain("sin efecto");
  });
});

describe("the swipe hint", () => {
  it("shows how to swipe", () => {
    const html = render(<SwipeHint />);

    expect(html).toContain("Desliza hacia arriba para lanzar");
    expect(html).toContain("Curva el gesto para darle efecto");
  });
});
