import { describe, expect, it, vi } from "vitest";
import { codeFromPath, inviteLink, shareInvite } from "../src/invite.js";

describe("Invite Link", () => {
  it("points at the Room Code on the app's origin", () => {
    expect(inviteLink("https://bolos.example", "K7MPQ")).toBe(
      "https://bolos.example/K7MPQ",
    );
  });

  it("pre-fills the Room Code it carries, in capitals", () => {
    expect(codeFromPath("/k7mpq")).toBe("K7MPQ");
  });

  it.each(["/", "/K7MP", "/favicon.ico", "/K7MPQ/extra"])(
    "pre-fills nothing from %j",
    (path) => {
      expect(codeFromPath(path)).toBe("");
    },
  );
});

describe("sharing the Invite Link", () => {
  const link = "https://bolos.example/K7MPQ";

  it("uses the phone's share sheet when there is one", async () => {
    const share = vi.fn().mockResolvedValue(undefined);

    expect(await shareInvite(link, { share })).toBe("shared");
    expect(share).toHaveBeenCalledWith({ title: "Bolos", url: link });
  });

  it("copies the link otherwise", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    expect(await shareInvite(link, { clipboard: { writeText } })).toBe(
      "copied",
    );
    expect(writeText).toHaveBeenCalledWith(link);
  });

  it("reports when neither works", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));

    expect(await shareInvite(link, { clipboard: { writeText } })).toBe(
      "failed",
    );
    expect(await shareInvite(link, {})).toBe("failed");
  });

  it("stays quiet when the Bowler dismisses the share sheet", async () => {
    const share = vi.fn().mockRejectedValue(new Error("AbortError"));

    expect(await shareInvite(link, { share })).toBe("dismissed");
  });
});
