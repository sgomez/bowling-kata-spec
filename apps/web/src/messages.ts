import type { CloseReason, ErrorCode } from "@bowling/domain";

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
  TOO_MANY_ROOMS: "Ahora mismo hay demasiadas salas. Prueba dentro de un rato.",
  TOO_MANY_CONNECTIONS: "Hay demasiadas conexiones desde tu red.",
  MESSAGE_TOO_LARGE: "Algo ha fallado. Recarga la página.",
  TOO_MANY_MESSAGES: "Vas demasiado rápido. Espera un momento.",
};

const CLOSED: Record<CloseReason, string> = {
  ROOM_CLOSED: "La sala se ha cerrado.",
  SERVER_SHUTDOWN:
    "El servidor se está reiniciando. Vuelve a entrar en un momento.",
};

export const closedMessage = (reason: CloseReason) => CLOSED[reason];

export const errorMessage = (code: ErrorCode) => MESSAGES[code];
