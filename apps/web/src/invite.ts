import { parseRoomCode } from "@bowling/domain";

export const inviteLink = (origin: string, code: string) => `${origin}/${code}`;

export const codeFromPath = (pathname: string) =>
  parseRoomCode(pathname.slice(1)) ?? "";

interface Sharer {
  share?: (data: ShareData) => Promise<void>;
  clipboard?: { writeText: (text: string) => Promise<void> };
}

export type ShareOutcome = "shared" | "dismissed" | "copied" | "failed";

export const shareInvite = async (
  url: string,
  { share, clipboard }: Sharer,
): Promise<ShareOutcome> => {
  if (share) {
    return share({ title: "Bolos", url }).then(
      () => "shared",
      () => "dismissed",
    );
  }
  if (clipboard) {
    return clipboard.writeText(url).then(
      () => "copied",
      () => "failed",
    );
  }
  return "failed";
};
