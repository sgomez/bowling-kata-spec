import type { ErrorCode } from "@bowling/domain";

const MESSAGES: Record<ErrorCode, string> = {
  ROOM_FULL: "La sala está completa: ya hay seis jugadores.",
  UNKNOWN_ROOM: "No existe ninguna sala con ese código.",
  NICKNAME_TAKEN: "Ese apodo ya está cogido en la sala. Elige otro.",
  NICKNAME_INVALID: "El apodo debe tener entre 1 y 16 caracteres.",
  GAMES_STARTED: "La partida ya ha empezado; no se puede entrar.",
  GAMES_NOT_FINISHED: "La partida todavía no ha terminado.",
  NOT_HOST: "Solo el anfitrión puede hacer eso.",
  INVALID_MESSAGE: "Algo ha fallado. Recarga la página.",
  ALREADY_IN_ROOM: "Ya estás en una sala.",
  NOT_IN_ROOM: "No estás en ninguna sala.",
  WINDOW_CLOSED: "Se ha acabado el tiempo de este frame.",
  FRAME_FINISHED: "Ya has terminado este frame.",
  PIN_NOT_STANDING: "Ese bolo ya no está en pie.",
};

export const errorMessage = (code: ErrorCode) => MESSAGES[code];
