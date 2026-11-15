export type RoomFailure =
  | { type: "NICKNAME_INVALID" }
  | { type: "NICKNAME_TAKEN" }
  | { type: "ROOM_FULL" }
  | { type: "GAMES_STARTED" }
  | { type: "GAMES_NOT_FINISHED" }
  | { type: "NOT_HOST" }
  | { type: "NOT_IN_ROOM" }
  | { type: "WINDOW_CLOSED" }
  | { type: "FRAME_FINISHED" }
  | { type: "PIN_NOT_STANDING" };

export type RoomResult = { ok: true } | { ok: false; failure: RoomFailure };

export type Created<T> =
  | { ok: true; room: T }
  | { ok: false; failure: RoomFailure };

export const OK = { ok: true } as const;

export const refuse = (type: RoomFailure["type"]) =>
  ({ ok: false, failure: { type } }) as const;
