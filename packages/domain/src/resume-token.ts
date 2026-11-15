import { parseRoomCode, type RoomCode } from "./room-code.js";

export type ResumeToken = string & { readonly __brand: "ResumeToken" };

const SEPARATOR = ".";

export const issueResumeToken = (code: RoomCode, nonce: string) =>
  `${code}${SEPARATOR}${nonce}` as ResumeToken;

export const roomOfResumeToken = (token: string): RoomCode | undefined => {
  const at = token.indexOf(SEPARATOR);
  return at < 0 ? undefined : parseRoomCode(token.slice(0, at));
};
