import * as v from "valibot";
import type { BowlerId, RoomFailure, RoomSnapshot } from "./room.js";

const nickname = v.pipe(v.string(), v.maxLength(64));

const ClientMessageSchema = v.variant("type", [
  v.object({ type: v.literal("create"), nickname }),
  v.object({
    type: v.literal("join"),
    code: v.pipe(v.string(), v.maxLength(16)),
    nickname,
  }),
  v.object({ type: v.literal("start") }),
]);

export type ClientMessage = v.InferOutput<typeof ClientMessageSchema>;

export type ErrorCode =
  | RoomFailure["type"]
  | "INVALID_MESSAGE"
  | "UNKNOWN_ROOM"
  | "ALREADY_IN_ROOM"
  | "NOT_IN_ROOM";

export type ServerMessage =
  | { type: "room"; you: BowlerId; room: RoomSnapshot }
  | { type: "error"; error: ErrorCode };

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

export const parseClientMessage = (raw: string): ClientMessage | undefined => {
  const result = v.safeParse(ClientMessageSchema, parseJson(raw));
  return result.success ? result.output : undefined;
};
