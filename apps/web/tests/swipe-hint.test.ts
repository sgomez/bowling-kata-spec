import { describe, expect, it } from "vitest";
import { hintSeen, rememberHint } from "../src/swipe-hint.js";

const memory = () => {
  const items = new Map<string, string>();
  return () => ({
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => items.set(key, value),
  });
};

const broken = () => {
  throw new Error("storage disabled");
};

describe("the swipe hint", () => {
  it("is shown to a first-time Bowler", () => {
    expect(hintSeen(memory())).toBe(false);
  });

  it("is not shown again once the Bowler has swiped", () => {
    const storage = memory();

    rememberHint(storage);

    expect(hintSeen(storage)).toBe(true);
  });

  it("keeps working when storage fails", () => {
    expect(() => rememberHint(broken)).not.toThrow();
    expect(hintSeen(broken)).toBe(false);
  });
});
