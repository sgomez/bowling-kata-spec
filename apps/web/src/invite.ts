import { parseRoomCode, roomOfResumeToken } from "@bowling/domain";

export const inviteLink = (origin: string, code: string) => `${origin}/${code}`;

export const codeFromPath = (pathname: string) =>
  parseRoomCode(pathname.slice(1)) ?? "";

export const resumableToken = (
  token: string | undefined,
  invitedCode: string,
) =>
  token && (!invitedCode || roomOfResumeToken(token) === invitedCode)
    ? token
    : undefined;

interface Sharer {
  share?: (data: ShareData) => Promise<void>;
  clipboard?: { writeText: (text: string) => Promise<void> };
}

export type ShareOutcome = "shared" | "dismissed" | "copied" | "failed";

export const shareInvite = async (
  url: string,
  sharer: Sharer,
): Promise<ShareOutcome> => {
  if (sharer.share) {
    try {
      await sharer.share({ title: "Bolos", url });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "dismissed";
      }
    }
  }
  if (sharer.clipboard) {
    try {
      await sharer.clipboard.writeText(url);
      return "copied";
    } catch {
      return "failed";
    }
  }
  return "failed";
};
