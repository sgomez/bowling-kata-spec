import { describe, expect, it, vi } from "vitest";
import {
  codeFromPath,
  inviteLink,
  resumableToken,
  shareInvite,
} from "../src/invite.js";

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

describe("opening an Invite Link with a stored resume token", () => {
  it("resumes when the link is for the same Room", () => {
    expect(resumableToken("K7MPQ.abc", "K7MPQ")).toBe("K7MPQ.abc");
  });

  it("drops the token when the link is for another Room", () => {
    expect(resumableToken("K7MPQ.abc", "ZZ234")).toBeUndefined();
  });

  it("resumes when there is no Invite Link", () => {
    expect(resumableToken("K7MPQ.abc", "")).toBe("K7MPQ.abc");
  });

  it("has nothing to resume without a token", () => {
    expect(resumableToken(undefined, "K7MPQ")).toBeUndefined();
  });
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

  it("calls the share sheet on the navigator itself", async () => {
    const sharer = {
      share(this: unknown) {
        if (this !== sharer) throw new TypeError("Illegal invocation");
        return Promise.resolve();
      },
    };

    expect(await shareInvite(link, sharer)).toBe("shared");
  });

  it("copies the link when the share sheet refuses", async () => {
    const share = vi
      .fn()
      .mockRejectedValue(new DOMException("blocked", "NotAllowedError"));
    const writeText = vi.fn().mockResolvedValue(undefined);

    expect(await shareInvite(link, { share, clipboard: { writeText } })).toBe(
      "copied",
    );
  });

  it("stays quiet when the Bowler dismisses the share sheet", async () => {
    const share = vi
      .fn()
      .mockRejectedValue(new DOMException("cancelled", "AbortError"));

    expect(await shareInvite(link, { share })).toBe("dismissed");
  });
});
