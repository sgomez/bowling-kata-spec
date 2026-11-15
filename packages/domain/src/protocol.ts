import * as v from "valibot";
import type { BowlerId } from "./bowler.js";
import { PINS } from "./pins.js";
import type { RoomFailure } from "./room-result.js";
import type { RoomSnapshot } from "./room-snapshot.js";

const nickname = v.pipe(v.string(), v.maxLength(64));
const id = v.pipe(v.string(), v.maxLength(64));

const ClientMessageSchema = v.variant("type", [
  v.object({ type: v.literal("create"), nickname }),
  v.object({
    type: v.literal("join"),
    code: v.pipe(v.string(), v.maxLength(16)),
    nickname,
  }),
  v.object({ type: v.literal("resume"), token: id }),
  v.object({ type: v.literal("start") }),
  v.object({ type: v.literal("leave") }),
  v.object({ type: v.literal("remove"), bowlerId: id }),
  v.object({
    type: v.literal("roll"),
    pins: v.pipe(v.array(v.picklist(PINS)), v.maxLength(PINS.length)),
  }),
]);

export type ClientMessage = v.InferOutput<typeof ClientMessageSchema>;

export type ErrorCode =
  | RoomFailure["type"]
  | "INVALID_MESSAGE"
  | "UNKNOWN_ROOM"
  | "UNKNOWN_SESSION"
  | "ALREADY_IN_ROOM"
  | "NOT_IN_ROOM";

export type ServerMessage =
  | { type: "room"; you: BowlerId; token: string; room: RoomSnapshot }
  | { type: "removed" }
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
